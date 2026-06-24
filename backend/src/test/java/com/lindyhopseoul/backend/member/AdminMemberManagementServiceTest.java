package com.lindyhopseoul.backend.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import com.lindyhopseoul.backend.admin.AdminLanguage;
import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminRole;
import com.lindyhopseoul.backend.eventmanagement.ApplicationContactMethod;
import com.lindyhopseoul.backend.eventmanagement.Event;
import com.lindyhopseoul.backend.eventmanagement.EventApplication;
import com.lindyhopseoul.backend.eventmanagement.EventApplicationRepository;
import com.lindyhopseoul.backend.eventmanagement.EventStatus;
import com.lindyhopseoul.backend.eventmanagement.EventType;
import com.lindyhopseoul.backend.eventmanagement.Lesson;
import com.lindyhopseoul.backend.eventmanagement.LessonScheduleType;
import com.lindyhopseoul.backend.eventmanagement.LessonStatus;
import com.lindyhopseoul.backend.eventmanagement.LessonType;
import com.lindyhopseoul.backend.exception.BadRequestException;
import com.lindyhopseoul.backend.exception.ConflictException;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AdminMemberManagementServiceTest {

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private EventApplicationRepository eventApplicationRepository;

    @Mock
    private AdminMemberActionLogRepository adminMemberActionLogRepository;

    private AdminMemberManagementService service;

    @BeforeEach
    void setUp() {
        service = new AdminMemberManagementService(
                memberRepository,
                eventApplicationRepository,
                adminMemberActionLogRepository
        );
    }

    @Test
    void findMembersRejectsNonOperatorAdmin() {
        AdminPrincipal memberAdmin = new AdminPrincipal(
                "member-admin",
                "Member Admin",
                "member",
                AdminRole.MEMBER,
                List.of(AdminRole.MEMBER),
                AdminLanguage.Kor
        );

        assertThatThrownBy(() -> service.findMembers(memberAdmin, null, null, null, null, null))
                .isInstanceOf(ForbiddenException.class);
        verifyNoInteractions(memberRepository, eventApplicationRepository);
    }

    @Test
    void findMembersSearchesAndSummarizesApplicationCounts() {
        AdminPrincipal staff = new AdminPrincipal(
                "staff-1",
                "Staff",
                "staff",
                AdminRole.STAFF,
                List.of(AdminRole.STAFF),
                AdminLanguage.Kor
        );
        Member member = member(1L);
        Event event = event();

        when(memberRepository.findAdminMembers(
                "%user%",
                null,
                "%example%",
                List.of(MemberStatus.ACTIVE),
                MemberPreferredLanguage.EN
        )).thenReturn(List.of(member));
        when(eventApplicationRepository.findByMemberIdsWithLesson(List.of(1L))).thenReturn(List.of(
                application(event, lesson(event, LessonType.LEVEL1), member),
                application(event, lesson(event, LessonType.LEVEL2), member),
                application(event, lesson(event, LessonType.LEVEL4), member),
                application(event, lesson(event, LessonType.WORKSHOP), member),
                application(event, null, member)
        ));

        List<AdminMemberResponse> responses = service.findMembers(
                staff,
                " User ",
                " ",
                "EXAMPLE",
                MemberStatus.ACTIVE,
                MemberPreferredLanguage.EN
        );

        assertThat(responses).hasSize(1);
        AdminMemberResponse response = responses.get(0);
        assertThat(response.memberId()).isEqualTo(1L);
        assertThat(response.memberStatus()).isEqualTo(MemberStatus.ACTIVE);
        assertThat(response.totalApplicationCount()).isEqualTo(5);
        assertThat(response.level1ApplicationCount()).isEqualTo(1);
        assertThat(response.level2ApplicationCount()).isEqualTo(1);
        assertThat(response.level3ApplicationCount()).isZero();
        assertThat(response.level4ApplicationCount()).isEqualTo(1);
        assertThat(response.workshopApplicationCount()).isEqualTo(2);
    }

    @Test
    void suspendMemberRequiresSuperAdminAndReason() {
        AdminPrincipal staff = new AdminPrincipal(
                "staff-1",
                "Staff",
                "staff",
                AdminRole.STAFF,
                List.of(AdminRole.STAFF),
                AdminLanguage.Kor
        );

        assertThatThrownBy(() -> service.suspendMember(
                staff,
                1L,
                new AdminMemberStatusChangeRequest("policy violation")
        )).isInstanceOf(ForbiddenException.class);
        verifyNoInteractions(memberRepository, adminMemberActionLogRepository);

        AdminPrincipal superAdmin = superAdmin();
        assertThatThrownBy(() -> service.suspendMember(
                superAdmin,
                1L,
                new AdminMemberStatusChangeRequest(" ")
        )).isInstanceOf(BadRequestException.class);
    }

    @Test
    void suspendMemberChangesActiveMemberAndWritesLog() {
        AdminPrincipal superAdmin = superAdmin();
        Member member = member(1L);
        when(memberRepository.findById(1L)).thenReturn(java.util.Optional.of(member));
        when(adminMemberActionLogRepository.save(any(AdminMemberActionLog.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(eventApplicationRepository.findByMemberIdsWithLesson(List.of(1L))).thenReturn(List.of());

        AdminMemberResponse response = service.suspendMember(
                superAdmin,
                1L,
                new AdminMemberStatusChangeRequest("운영 정책 위반")
        );

        assertThat(response.memberStatus()).isEqualTo(MemberStatus.SUSPENDED);
        assertThat(member.getStatus()).isEqualTo(MemberStatus.SUSPENDED);
        assertThat(member.getEmail()).isEqualTo("user1@example.com");
        assertThat(member.getProviderId()).isEqualTo("google-sub-1");

        ArgumentCaptor<AdminMemberActionLog> logCaptor = ArgumentCaptor.forClass(AdminMemberActionLog.class);
        verify(adminMemberActionLogRepository).save(logCaptor.capture());
        AdminMemberActionLog log = logCaptor.getValue();
        assertThat(log.getAction()).isEqualTo(AdminMemberActionType.MEMBER_SUSPENDED);
        assertThat(log.getPreviousMemberStatus()).isEqualTo(MemberStatus.ACTIVE);
        assertThat(log.getNextMemberStatus()).isEqualTo(MemberStatus.SUSPENDED);
        assertThat(log.getReason()).isEqualTo("운영 정책 위반");
    }

    @Test
    void reactivateMemberChangesSuspendedMemberAndWritesLog() {
        AdminPrincipal superAdmin = superAdmin();
        Member member = member(1L);
        member.suspend();
        when(memberRepository.findById(1L)).thenReturn(java.util.Optional.of(member));
        when(adminMemberActionLogRepository.save(any(AdminMemberActionLog.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(eventApplicationRepository.findByMemberIdsWithLesson(List.of(1L))).thenReturn(List.of());

        AdminMemberResponse response = service.reactivateMember(
                superAdmin,
                1L,
                new AdminMemberStatusChangeRequest("소명 확인")
        );

        assertThat(response.memberStatus()).isEqualTo(MemberStatus.ACTIVE);
        assertThat(member.getStatus()).isEqualTo(MemberStatus.ACTIVE);

        ArgumentCaptor<AdminMemberActionLog> logCaptor = ArgumentCaptor.forClass(AdminMemberActionLog.class);
        verify(adminMemberActionLogRepository).save(logCaptor.capture());
        AdminMemberActionLog log = logCaptor.getValue();
        assertThat(log.getAction()).isEqualTo(AdminMemberActionType.MEMBER_REACTIVATED);
        assertThat(log.getPreviousMemberStatus()).isEqualTo(MemberStatus.SUSPENDED);
        assertThat(log.getNextMemberStatus()).isEqualTo(MemberStatus.ACTIVE);
        assertThat(log.getReason()).isEqualTo("소명 확인");
    }

    @Test
    void withdrawnMemberCannotBeSuspendedOrReactivated() {
        AdminPrincipal superAdmin = superAdmin();
        Member member = member(1L);
        member.withdraw(Instant.parse("2026-06-24T00:00:00Z"));
        when(memberRepository.findById(1L)).thenReturn(java.util.Optional.of(member));

        assertThatThrownBy(() -> service.suspendMember(
                superAdmin,
                1L,
                new AdminMemberStatusChangeRequest("reason")
        )).isInstanceOf(ConflictException.class);

        assertThatThrownBy(() -> service.reactivateMember(
                superAdmin,
                1L,
                new AdminMemberStatusChangeRequest("reason")
        )).isInstanceOf(ConflictException.class);
    }

    private Member member(Long id) {
        Member member = Member.createGoogle(
                "google-sub-" + id,
                "user" + id + "@example.com",
                "User " + id,
                Instant.parse("2026-06-23T00:00:00Z")
        );
        member.updateSettings("Nick " + id, MemberPreferredLanguage.EN);
        ReflectionTestUtils.setField(member, "id", id);
        return member;
    }

    private AdminPrincipal superAdmin() {
        return new AdminPrincipal(
                "super-1",
                "Super",
                "super",
                AdminRole.SUPER_ADMIN,
                List.of(AdminRole.SUPER_ADMIN),
                AdminLanguage.Kor
        );
    }

    private Event event() {
        return Event.create(
                EventType.REGULAR_CLASS,
                LocalDate.parse("2026-07-01"),
                LocalDate.parse("2026-07-01"),
                LocalTime.of(19, 0),
                LocalTime.of(20, 0),
                "Studio",
                EventStatus.PUBLISHED,
                1
        );
    }

    private Lesson lesson(Event event, LessonType lessonType) {
        return Lesson.create(
                event,
                lessonType,
                LessonScheduleType.SINGLE_DAY,
                LocalDate.parse("2026-07-01"),
                LocalDate.parse("2026-07-01"),
                LocalTime.of(19, 0),
                LocalTime.of(20, 0),
                BigDecimal.ZERO,
                "KRW",
                LessonStatus.PUBLISHED,
                1
        );
    }

    private EventApplication application(Event event, Lesson lesson, Member member) {
        return EventApplication.create(
                event,
                lesson,
                member,
                "Applicant",
                ApplicationContactMethod.KAKAO_TALK,
                "contact",
                "",
                "ko",
                null
        );
    }
}
