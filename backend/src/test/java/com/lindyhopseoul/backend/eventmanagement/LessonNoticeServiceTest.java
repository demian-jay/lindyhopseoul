package com.lindyhopseoul.backend.eventmanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import com.lindyhopseoul.backend.admin.AdminLanguage;
import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminRole;
import com.lindyhopseoul.backend.admin.TeacherUser;
import com.lindyhopseoul.backend.admin.TeacherUserRepository;
import com.lindyhopseoul.backend.admin.UserAccount;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import com.lindyhopseoul.backend.exception.ResourceNotFoundException;
import com.lindyhopseoul.backend.member.Member;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class LessonNoticeServiceTest {

    @Mock
    private LessonRepository lessonRepository;

    @Mock
    private LessonNoticeRepository lessonNoticeRepository;

    @Mock
    private LessonNoticeReadStateRepository lessonNoticeReadStateRepository;

    @Mock
    private EventApplicationRepository eventApplicationRepository;

    @Mock
    private TeacherUserRepository teacherUserRepository;

    private LessonNoticeService service;

    @BeforeEach
    void setUp() {
        service = new LessonNoticeService(
                lessonRepository,
                lessonNoticeRepository,
                lessonNoticeReadStateRepository,
                eventApplicationRepository,
                teacherUserRepository
        );
    }

    @Test
    void createNoticeAllowsAssignedTeacherAndStoresDisplaySnapshot() {
        UserAccount teacherAccount = teacherAccount("U1", "Jay Account");
        TeacherUser teacherUser = TeacherUser.createProfile("T1", "Gamja", teacherAccount, "SYSTEM");
        Lesson lesson = lesson(event(1L), 2L, teacherUser);
        AdminPrincipal teacher = new AdminPrincipal(
                "U1",
                "Jay Account",
                "teacher",
                AdminRole.TEACHER,
                List.of(AdminRole.TEACHER),
                AdminLanguage.Kor
        );
        when(lessonRepository.findDetailsById(2L)).thenReturn(Optional.of(lesson));
        when(teacherUserRepository.findFirstByUserAccount_UserIdAndUseYnOrderByTeacherUserNmAsc("U1", "Y"))
                .thenReturn(Optional.of(teacherUser));
        when(lessonNoticeRepository.save(any(LessonNotice.class))).thenAnswer(invocation -> {
            LessonNotice notice = invocation.getArgument(0);
            ReflectionTestUtils.setField(notice, "id", 9L);
            notice.prePersist();
            return notice;
        });

        LessonNoticeResponse response = service.createAdminNotice(
                teacher,
                2L,
                new LessonNoticeCreateRequest("  이번 주 수업은 10분 일찍 시작합니다.  ")
        );

        ArgumentCaptor<LessonNotice> noticeCaptor = ArgumentCaptor.forClass(LessonNotice.class);
        verify(lessonNoticeRepository).save(noticeCaptor.capture());
        LessonNotice savedNotice = noticeCaptor.getValue();

        assertThat(response.id()).isEqualTo(9L);
        assertThat(response.authorNickname()).isEqualTo("Gamja");
        assertThat(response.authorDisplayName()).isEqualTo("Jay Account");
        assertThat(savedNotice.getContent()).isEqualTo("이번 주 수업은 10분 일찍 시작합니다.");
        assertThat(savedNotice.getAuthorAdminId()).isEqualTo("U1");
        assertThat(savedNotice.getAuthorNicknameSnapshot()).isEqualTo("Gamja");
        assertThat(savedNotice.getAuthorDisplayNameSnapshot()).isEqualTo("Jay Account");
    }

    @Test
    void createNoticeRejectsUnassignedTeacher() {
        UserAccount assignedAccount = teacherAccount("U1", "Assigned");
        TeacherUser assignedTeacher = TeacherUser.createProfile("T1", "Assigned Teacher", assignedAccount, "SYSTEM");
        UserAccount otherAccount = teacherAccount("U2", "Other");
        TeacherUser otherTeacher = TeacherUser.createProfile("T2", "Other Teacher", otherAccount, "SYSTEM");
        Lesson lesson = lesson(event(1L), 2L, assignedTeacher);
        AdminPrincipal otherPrincipal = new AdminPrincipal(
                "U2",
                "Other",
                "other",
                AdminRole.TEACHER,
                List.of(AdminRole.TEACHER),
                AdminLanguage.Kor
        );
        when(lessonRepository.findDetailsById(2L)).thenReturn(Optional.of(lesson));
        when(teacherUserRepository.findFirstByUserAccount_UserIdAndUseYnOrderByTeacherUserNmAsc("U2", "Y"))
                .thenReturn(Optional.of(otherTeacher));

        assertThatThrownBy(() -> service.createAdminNotice(
                otherPrincipal,
                2L,
                new LessonNoticeCreateRequest("공지")
        )).isInstanceOf(ForbiddenException.class);

        verify(lessonNoticeRepository, never()).save(any(LessonNotice.class));
    }

    @Test
    void findUnreadCountCountsLessonsWithNoticeAfterLastRead() {
        Event event = event(1L);
        Lesson unreadLesson = lesson(event, 2L);
        Lesson readLesson = lesson(event, 3L);
        Member member = member(7L);
        EventApplication unreadApplication = application(event, unreadLesson, member);
        EventApplication readApplication = application(event, readLesson, member);
        LessonNotice unreadNotice = notice(unreadLesson, 20L, Instant.parse("2026-06-24T09:00:00Z"));
        LessonNotice readNotice = notice(readLesson, 21L, Instant.parse("2026-06-24T08:00:00Z"));
        LessonNoticeReadState unreadReadState = LessonNoticeReadState.create(
                unreadLesson,
                member,
                Instant.parse("2026-06-24T08:30:00Z")
        );
        LessonNoticeReadState readReadState = LessonNoticeReadState.create(
                readLesson,
                member,
                Instant.parse("2026-06-24T09:30:00Z")
        );
        when(eventApplicationRepository.findByMember_IdOrderByCreatedAtDescIdDesc(7L))
                .thenReturn(List.of(unreadApplication, readApplication));
        when(lessonNoticeRepository.findLatestCandidatesByLessonIds(List.of(2L, 3L)))
                .thenReturn(List.of(unreadNotice, readNotice));
        when(lessonNoticeReadStateRepository.findByMember_IdAndLesson_IdIn(7L, List.of(2L, 3L)))
                .thenReturn(List.of(unreadReadState, readReadState));

        LessonNoticeUnreadCountResponse response = service.findMemberUnreadCount(member);

        assertThat(response.count()).isEqualTo(1);
    }

    @Test
    void markReadRejectsMembersWithoutActiveApplication() {
        Event event = event(1L);
        Lesson lesson = lesson(event, 2L);
        Member member = member(7L);
        when(lessonRepository.findDetailsById(2L)).thenReturn(Optional.of(lesson));
        when(eventApplicationRepository.countByMemberIdAndApplicationTarget(7L, 1L, 2L)).thenReturn(0L);

        assertThatThrownBy(() -> service.markMemberNoticesRead(member, 2L))
                .isInstanceOf(ForbiddenException.class);

        verify(lessonNoticeReadStateRepository, never()).save(any(LessonNoticeReadState.class));
    }

    @Test
    void updateNoticeChangesContentForManager() {
        Lesson lesson = lesson(event(1L), 2L);
        LessonNotice existing = notice(lesson, 9L, Instant.parse("2026-06-24T09:00:00Z"));
        when(lessonRepository.findDetailsById(2L)).thenReturn(Optional.of(lesson));
        when(lessonNoticeRepository.findById(9L)).thenReturn(Optional.of(existing));

        LessonNoticeResponse response = service.updateAdminNotice(
                manager(), 2L, 9L, new LessonNoticeCreateRequest("  수정된 공지  "));

        assertThat(existing.getContent()).isEqualTo("수정된 공지");
        assertThat(response.id()).isEqualTo(9L);
    }

    @Test
    void deleteNoticeRemovesNoticeForManager() {
        Lesson lesson = lesson(event(1L), 2L);
        LessonNotice existing = notice(lesson, 9L, Instant.parse("2026-06-24T09:00:00Z"));
        when(lessonRepository.findDetailsById(2L)).thenReturn(Optional.of(lesson));
        when(lessonNoticeRepository.findById(9L)).thenReturn(Optional.of(existing));

        service.deleteAdminNotice(manager(), 2L, 9L);

        verify(lessonNoticeRepository).delete(existing);
    }

    @Test
    void updateNoticeRejectsNoticeFromAnotherLesson() {
        Lesson lesson = lesson(event(1L), 2L);
        Lesson otherLesson = lesson(event(1L), 3L);
        LessonNotice otherNotice = notice(otherLesson, 9L, Instant.parse("2026-06-24T09:00:00Z"));
        when(lessonRepository.findDetailsById(2L)).thenReturn(Optional.of(lesson));
        when(lessonNoticeRepository.findById(9L)).thenReturn(Optional.of(otherNotice));

        assertThatThrownBy(() -> service.updateAdminNotice(
                manager(), 2L, 9L, new LessonNoticeCreateRequest("x")))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(lessonNoticeRepository, never()).delete(any(LessonNotice.class));
    }

    private AdminPrincipal manager() {
        return new AdminPrincipal(
                "S1", "Staff", "staff", AdminRole.STAFF, List.of(AdminRole.STAFF), AdminLanguage.Kor);
    }

    private UserAccount teacherAccount(String userId, String name) {
        return UserAccount.create(
                userId,
                name,
                userId.toLowerCase(),
                null,
                "hash",
                AdminLanguage.Kor,
                List.of(AdminRole.TEACHER)
        );
    }

    private Event event(Long id) {
        Event event = Event.create(
                EventType.REGULAR_CLASS,
                LocalDate.of(2026, 7, 6),
                LocalDate.of(2026, 7, 27),
                LocalTime.of(14, 0),
                LocalTime.of(17, 0),
                "Swingpop Studio",
                EventStatus.PUBLISHED,
                10
        );
        ReflectionTestUtils.setField(event, "id", id);
        return event;
    }

    private Lesson lesson(Event event, Long id, TeacherUser... teachers) {
        Lesson lesson = Lesson.create(
                event,
                LessonType.LEVEL1,
                LessonScheduleType.PERIOD,
                LocalDate.of(2026, 7, 6),
                LocalDate.of(2026, 7, 27),
                LocalTime.of(14, 0),
                LocalTime.of(15, 20),
                new BigDecimal("80000"),
                "KRW",
                LessonStatus.PUBLISHED,
                10
        );
        ReflectionTestUtils.setField(lesson, "id", id);
        Set.of(teachers).forEach(teacher -> lesson.addTeacher(new LessonTeacher(teacher, "TEACHER", 10)));
        return lesson;
    }

    private EventApplication application(Event event, Lesson lesson, Member member) {
        return EventApplication.create(
                event,
                lesson,
                member,
                member.getDisplayName(),
                ApplicationContactMethod.EMAIL,
                member.getEmail(),
                "",
                "ko",
                null
        );
    }

    private Member member(Long id) {
        Member member = Member.createGoogle(
                "google-sub-" + id,
                "member" + id + "@example.com",
                "Member " + id,
                Instant.parse("2026-06-23T00:00:00Z")
        );
        ReflectionTestUtils.setField(member, "id", id);
        return member;
    }

    private LessonNotice notice(Lesson lesson, Long id, Instant createdAt) {
        LessonNotice notice = LessonNotice.create(
                lesson,
                "공지",
                "A1",
                "Gamja",
                "Jay"
        );
        ReflectionTestUtils.setField(notice, "id", id);
        ReflectionTestUtils.setField(notice, "createdAt", createdAt);
        return notice;
    }
}
