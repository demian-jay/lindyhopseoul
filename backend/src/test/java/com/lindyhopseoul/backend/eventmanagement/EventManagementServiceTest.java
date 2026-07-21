package com.lindyhopseoul.backend.eventmanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import com.lindyhopseoul.backend.admin.AdminLanguage;
import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminRole;
import com.lindyhopseoul.backend.admin.TeacherUser;
import com.lindyhopseoul.backend.admin.TeacherUserRepository;
import com.lindyhopseoul.backend.admin.UserAccount;
import com.lindyhopseoul.backend.exception.ConflictException;
import com.lindyhopseoul.backend.member.AdminMemberActionLog;
import com.lindyhopseoul.backend.member.AdminMemberActionLogRepository;
import com.lindyhopseoul.backend.member.AdminMemberActionType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class EventManagementServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private LessonRepository lessonRepository;

    @Mock
    private MessageTemplateRepository messageTemplateRepository;

    @Mock
    private TeacherUserRepository teacherUserRepository;

    @Mock
    private EventApplicationRepository eventApplicationRepository;

    @Mock
    private AdminMemberActionLogRepository adminMemberActionLogRepository;

    @Mock
    private LessonNoticeRepository lessonNoticeRepository;

    @Mock
    private LessonNoticeReadStateRepository lessonNoticeReadStateRepository;

    private EventManagementService service;
    private AdminPrincipal superAdmin;

    @BeforeEach
    void setUp() {
        service = new EventManagementService(
                eventRepository,
                lessonRepository,
                messageTemplateRepository,
                teacherUserRepository,
                eventApplicationRepository,
                adminMemberActionLogRepository,
                lessonNoticeRepository,
                lessonNoticeReadStateRepository
        );
        superAdmin = new AdminPrincipal(
                "A1",
                "Admin",
                "admin",
                AdminRole.SUPER_ADMIN,
                List.of(AdminRole.SUPER_ADMIN),
                AdminLanguage.Kor
        );
    }

    @Test
    void deleteEventClearsDependentsBeforeDeletingEvent() {
        Lesson lesson1 = mock(Lesson.class);
        Lesson lesson2 = mock(Lesson.class);
        when(lesson1.getId()).thenReturn(3L);
        when(lesson2.getId()).thenReturn(4L);
        Event event = mock(Event.class);
        when(event.getLessons()).thenReturn(new java.util.LinkedHashSet<>(List.of(lesson1, lesson2)));
        when(eventRepository.findById(2L)).thenReturn(Optional.of(event));

        service.deleteEvent(superAdmin, 2L);

        // Notices/read-states/applications FK to the lessons, so they must be removed
        // before the event (and its cascaded lessons) is deleted.
        InOrder order = inOrder(
                lessonNoticeReadStateRepository,
                lessonNoticeRepository,
                eventApplicationRepository,
                eventRepository);
        order.verify(lessonNoticeReadStateRepository).deleteByLessonIdIn(List.of(3L, 4L));
        order.verify(lessonNoticeRepository).deleteByLessonIdIn(List.of(3L, 4L));
        order.verify(eventApplicationRepository).deleteByEventId(2L);
        order.verify(eventRepository).delete(event);
    }

    @Test
    void teacherReadingLessonsSeesParticipantsOnlyForOwnLessons() {
        Event event = Event.create(
                EventType.REGULAR_CLASS,
                LocalDate.of(2026, 7, 6),
                LocalDate.of(2026, 7, 27),
                LocalTime.of(14, 0),
                LocalTime.of(17, 0),
                "Studio",
                EventStatus.PUBLISHED,
                10
        );
        event.replaceTranslations(Set.of(new EventTranslation("ko", "정규수업", "안내", "설명")));

        UserAccount teacherAccount = mock(UserAccount.class);
        TeacherUser mine = TeacherUser.createProfile("T_MINE", "My Teacher", teacherAccount, "A1");
        TeacherUser other = TeacherUser.createProfile("T_OTHER", "Other Teacher", teacherAccount, "A1");

        Lesson ownLesson = lessonWithTeacher(event, mine, 1L);
        Lesson otherLesson = lessonWithTeacher(event, other, 2L);

        EventApplication ownApplication = EventApplication.create(
                event, ownLesson, "Mine", ApplicationContactMethod.EMAIL, "mine@example.com", "", "ko", null);
        EventApplication otherApplication = EventApplication.create(
                event, otherLesson, "Theirs", ApplicationContactMethod.EMAIL, "theirs@example.com", "", "ko", null);

        AdminPrincipal teacher = new AdminPrincipal(
                "U1", "My Teacher", "teacher1", AdminRole.TEACHER, List.of(AdminRole.TEACHER), AdminLanguage.Kor);

        when(eventRepository.existsById(1L)).thenReturn(true);
        when(lessonRepository.findByEventIdWithDetails(1L)).thenReturn(List.of(ownLesson, otherLesson));
        when(teacherUserRepository.findFirstByUserAccount_UserIdAndUseYnOrderByTeacherUserNmAsc("U1", "Y"))
                .thenReturn(Optional.of(mine));
        // Only the teacher's own lesson may be queried for applicants at all.
        when(eventApplicationRepository.findByLesson_IdInOrderByCreatedAtAscIdAsc(List.of(1L)))
                .thenReturn(List.of(ownApplication));

        List<LessonResponse> lessons = service.findLessons(teacher, 1L);

        assertThat(lessons).hasSize(2);
        assertThat(lessons.get(0).participants()).extracting(EventApplicationResponse::applicantName)
                .containsExactly("Mine");
        assertThat(lessons.get(1).participants()).isEmpty();
        // The other lesson's applicants are never even fetched, so their names and
        // contact details cannot leak through this endpoint.
        verify(eventApplicationRepository, never())
                .findByLesson_IdInOrderByCreatedAtAscIdAsc(List.of(1L, 2L));
        assertThat(otherApplication.getApplicantName()).isEqualTo("Theirs");
    }

    @Test
    void staffReadingLessonsSeesEveryParticipant() {
        Event event = Event.create(
                EventType.REGULAR_CLASS,
                LocalDate.of(2026, 7, 6),
                LocalDate.of(2026, 7, 27),
                LocalTime.of(14, 0),
                LocalTime.of(17, 0),
                "Studio",
                EventStatus.PUBLISHED,
                10
        );
        event.replaceTranslations(Set.of(new EventTranslation("ko", "정규수업", "안내", "설명")));

        UserAccount teacherAccount = mock(UserAccount.class);
        TeacherUser other = TeacherUser.createProfile("T_OTHER", "Other Teacher", teacherAccount, "A1");
        Lesson lesson = lessonWithTeacher(event, other, 2L);
        EventApplication application = EventApplication.create(
                event, lesson, "Theirs", ApplicationContactMethod.EMAIL, "theirs@example.com", "", "ko", null);

        AdminPrincipal staff = new AdminPrincipal(
                "S1", "Staff", "staff", AdminRole.STAFF, List.of(AdminRole.STAFF), AdminLanguage.Kor);

        when(eventRepository.existsById(1L)).thenReturn(true);
        when(lessonRepository.findByEventIdWithDetails(1L)).thenReturn(List.of(lesson));
        when(eventApplicationRepository.findByLesson_IdInOrderByCreatedAtAscIdAsc(List.of(2L)))
                .thenReturn(List.of(application));

        List<LessonResponse> lessons = service.findLessons(staff, 1L);

        assertThat(lessons.get(0).participants()).extracting(EventApplicationResponse::applicantName)
                .containsExactly("Theirs");
        // Staff never go through the teacher lookup.
        verify(teacherUserRepository, never())
                .findFirstByUserAccount_UserIdAndUseYnOrderByTeacherUserNmAsc(any(), any());
    }

    private Lesson lessonWithTeacher(Event event, TeacherUser teacherUser, Long lessonId) {
        Lesson lesson = Lesson.create(
                event,
                LessonType.LEVEL1,
                LessonScheduleType.PERIOD,
                LocalDate.of(2026, 7, 6),
                LocalDate.of(2026, 7, 27),
                LocalTime.of(14, 0),
                LocalTime.of(15, 0),
                new BigDecimal("80000"),
                "KRW",
                LessonStatus.PUBLISHED,
                10
        );
        lesson.replaceTranslations(Set.of(new LessonTranslation("ko", "레벨1", "초급 수업")));
        lesson.addTeacher(new LessonTeacher(teacherUser, "LEAD", 10));
        ReflectionTestUtils.setField(lesson, "id", lessonId);
        return lesson;
    }

    @Test
    void removeEventApplicationMarksApplicationRemovedAndWritesLog() {
        Event event = Event.create(
                EventType.REGULAR_CLASS,
                LocalDate.of(2026, 7, 6),
                LocalDate.of(2026, 7, 27),
                LocalTime.of(14, 0),
                LocalTime.of(17, 0),
                "Studio",
                EventStatus.PUBLISHED,
                10
        );
        event.replaceTranslations(Set.of(
                new EventTranslation("ko", "스윙팝 정규수업", "안내", "설명")
        ));
        Lesson lesson = Lesson.create(
                event,
                LessonType.LEVEL1,
                LessonScheduleType.PERIOD,
                LocalDate.of(2026, 7, 6),
                LocalDate.of(2026, 7, 27),
                LocalTime.of(14, 0),
                LocalTime.of(15, 0),
                new BigDecimal("80000"),
                "KRW",
                LessonStatus.PUBLISHED,
                10
        );
        lesson.replaceTranslations(Set.of(
                new LessonTranslation("ko", "레벨1", "초급 수업")
        ));
        EventApplication application = EventApplication.create(
                event,
                lesson,
                "Alex",
                ApplicationContactMethod.EMAIL,
                "alex@example.com",
                "",
                "ko",
                null
        );
        ReflectionTestUtils.setField(application, "id", 9L);
        when(eventApplicationRepository.findById(9L)).thenReturn(Optional.of(application));
        when(adminMemberActionLogRepository.save(any(AdminMemberActionLog.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        EventApplicationResponse response = service.removeEventApplication(
                superAdmin,
                9L,
                new EventApplicationRemoveRequest(null)
        );

        assertThat(response.id()).isEqualTo(9L);
        assertThat(application.getStatus()).isEqualTo(EventApplicationStatus.REMOVED);
        assertThat(application.getRemovedBy()).isEqualTo("A1");
        assertThat(application.getRemovedAt()).isNotNull();

        ArgumentCaptor<AdminMemberActionLog> logCaptor = ArgumentCaptor.forClass(AdminMemberActionLog.class);
        verify(adminMemberActionLogRepository).save(logCaptor.capture());
        AdminMemberActionLog log = logCaptor.getValue();
        assertThat(log.getAction()).isEqualTo(AdminMemberActionType.LESSON_APPLICATION_REMOVED);
        assertThat(log.getActorAdminId()).isEqualTo("A1");
        assertThat(log.getActorRole()).isEqualTo(AdminRole.SUPER_ADMIN);
        assertThat(log.getEventApplicationId()).isEqualTo(9L);
        assertThat(log.getApplicantName()).isEqualTo("Alex");
        assertThat(log.getApplicantEmail()).isEqualTo("alex@example.com");
        assertThat(log.getLessonTitle()).isEqualTo("레벨1");
    }

    @Test
    void removeEventApplicationRejectsAlreadyRemovedApplication() {
        Event event = Event.create(
                EventType.REGULAR_CLASS,
                LocalDate.of(2026, 7, 6),
                LocalDate.of(2026, 7, 27),
                LocalTime.of(14, 0),
                LocalTime.of(17, 0),
                "Studio",
                EventStatus.PUBLISHED,
                10
        );
        EventApplication application = EventApplication.create(
                event,
                null,
                "Alex",
                ApplicationContactMethod.KAKAO_TALK,
                "alex",
                "",
                "ko",
                null
        );
        application.markRemoved("A1", null);
        when(eventApplicationRepository.findById(9L)).thenReturn(Optional.of(application));

        assertThatThrownBy(() -> service.removeEventApplication(superAdmin, 9L, null))
                .isInstanceOf(ConflictException.class);

        verify(adminMemberActionLogRepository, never()).save(any(AdminMemberActionLog.class));
    }

    @Test
    void createEventRejectsEnabledAddressInfoWithoutMapUrls() {
        EventRequest request = eventRequest(true, "", "");

        assertThatThrownBy(() -> service.createEvent(superAdmin, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Google Maps URL or Naver Map URL");
    }

    @Test
    void createEventRejectsMapUrlWithoutHttpScheme() {
        EventRequest request = eventRequest(true, "maps.app.goo.gl/place", "");

        assertThatThrownBy(() -> service.createEvent(superAdmin, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("http:// or https://");
    }

    @Test
    void createEventStoresAddressInfoWhenValid() {
        EventRequest request = eventRequest(true, "https://maps.app.goo.gl/ypA9zfFkKVqwJoT96", "https://naver.me/x2jQH2Tt");

        EventResponse response = service.createEvent(superAdmin, request);

        assertThat(response.addressInfoEnabled()).isTrue();
        assertThat(response.googleMapUrl()).isEqualTo("https://maps.app.goo.gl/ypA9zfFkKVqwJoT96");
        assertThat(response.naverMapUrl()).isEqualTo("https://naver.me/x2jQH2Tt");
    }

    @Test
    void createLessonRejectsInactiveTeacher() {
        Event event = Event.create(
                EventType.REGULAR_CLASS,
                LocalDate.of(2026, 7, 6),
                LocalDate.of(2026, 7, 27),
                LocalTime.of(14, 0),
                LocalTime.of(17, 0),
                "Studio",
                EventStatus.PUBLISHED,
                10
        );
        UserAccount teacherAccount = UserAccount.create(
                "U1",
                "Teacher",
                "teacher",
                null,
                "hash",
                AdminLanguage.Kor,
                List.of(AdminRole.TEACHER)
        );
        TeacherUser inactiveTeacher = TeacherUser.createProfile(
                "T1",
                "Teacher",
                teacherAccount,
                "SYSTEM"
        );
        inactiveTeacher.deactivate("SYSTEM");
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event));
        when(teacherUserRepository.findAllById(List.of("T1"))).thenReturn(List.of(inactiveTeacher));

        LessonRequest request = new LessonRequest(
                LessonType.LEVEL1,
                LessonScheduleType.PERIOD,
                LocalDate.of(2026, 7, 6),
                LocalDate.of(2026, 7, 27),
                LocalTime.of(14, 0),
                LocalTime.of(15, 0),
                new BigDecimal("80000"),
                "KRW",
                LessonStatus.PUBLISHED,
                10,
                false,
                List.of("T1"),
                Map.of(
                        "ko", new LessonRequest.LessonTranslationRequest("레벨1", "초급 수업"),
                        "en", new LessonRequest.LessonTranslationRequest("Level 1", "Beginner class")
                )
        );

        assertThatThrownBy(() -> service.createLesson(superAdmin, 1L, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("T1");
    }

    @Test
    void renderMessageTemplateReplacesEventAndLessonVariables() {
        Event event = Event.create(
                EventType.PARTY,
                LocalDate.of(2026, 7, 18),
                LocalDate.of(2026, 7, 18),
                LocalTime.of(18, 0),
                LocalTime.of(22, 0),
                "Swingpop Hall",
                EventStatus.PUBLISHED,
                10
        );
        event.replaceTranslations(Set.of(
                new EventTranslation("ko", "스윙팝 파티", "파티 안내", "파티 설명"),
                new EventTranslation("en", "Swingpop Party", "Party notice", "Party description")
        ));
        Lesson lesson = Lesson.create(
                event,
                LessonType.WORKSHOP,
                LessonScheduleType.SINGLE_DAY,
                LocalDate.of(2026, 7, 18),
                LocalDate.of(2026, 7, 18),
                LocalTime.of(18, 30),
                LocalTime.of(19, 30),
                new BigDecimal("30000"),
                "KRW",
                LessonStatus.PUBLISHED,
                10
        );
        lesson.replaceTranslations(Set.of(
                new LessonTranslation("ko", "찰스턴 워크샵", "찰스턴"),
                new LessonTranslation("en", "Charleston Workshop", "Charleston")
        ));
        event.addLesson(lesson);
        MessageTemplate template = MessageTemplate.create(
                "홍보글",
                MessageTemplateType.PARTY_PROMOTION,
                "{{event.title.ko}}\n{{lessons.workshop.title.en}}\n{{lessons.workshop.fee}}",
                "Y"
        );
        when(messageTemplateRepository.findById(1L)).thenReturn(Optional.of(template));
        when(eventRepository.findDetailsById(2L)).thenReturn(Optional.of(event));

        MessageRenderResponse response = service.renderMessageTemplate(
                superAdmin,
                1L,
                new MessageRenderRequest(2L, "ko")
        );

        assertThat(response.renderedText()).contains("스윙팝 파티");
        assertThat(response.renderedText()).contains("Charleston Workshop");
        assertThat(response.renderedText()).contains("30000 KRW");
    }

    @Test
    void createMessageTemplateStoresEnglishContent() {
        MessageTemplateRequest request = new MessageTemplateRequest(
                "English announcement",
                MessageTemplateType.PARTY_PROMOTION,
                "",
                "English body",
                "Y"
        );

        MessageTemplateResponse response = service.createMessageTemplate(superAdmin, request);

        assertThat(response.content()).isEqualTo("English body");
        assertThat(response.contentEn()).isEqualTo("English body");
    }

    @Test
    void renderMessageTemplateUsesEnglishContentWhenLanguageIsEnglish() {
        Event event = Event.create(
                EventType.PARTY,
                LocalDate.of(2026, 7, 18),
                LocalDate.of(2026, 7, 18),
                LocalTime.of(18, 0),
                LocalTime.of(22, 0),
                "Swingpop Hall",
                EventStatus.PUBLISHED,
                10
        );
        event.replaceTranslations(Set.of(
                new EventTranslation("ko", "스윙팝 파티", "파티 안내", "파티 설명"),
                new EventTranslation("en", "Swingpop Party", "Party notice", "Party description")
        ));
        MessageTemplate template = MessageTemplate.create(
                "홍보글",
                MessageTemplateType.PARTY_PROMOTION,
                "한국어 {{event.title.ko}}",
                "English {{event.title.en}}",
                "Y"
        );
        when(messageTemplateRepository.findById(1L)).thenReturn(Optional.of(template));
        when(eventRepository.findDetailsById(2L)).thenReturn(Optional.of(event));

        MessageRenderResponse response = service.renderMessageTemplate(
                superAdmin,
                1L,
                new MessageRenderRequest(2L, "en")
        );

        assertThat(response.renderedText()).isEqualTo("English Swingpop Party");
    }

    private EventRequest eventRequest(boolean addressInfoEnabled, String googleMapUrl, String naverMapUrl) {
        return new EventRequest(
                EventType.REGULAR_CLASS,
                LocalDate.of(2026, 7, 6),
                LocalDate.of(2026, 7, 27),
                LocalTime.of(14, 0),
                LocalTime.of(17, 0),
                "Studio",
                addressInfoEnabled,
                googleMapUrl,
                naverMapUrl,
                EventStatus.PUBLISHED,
                10,
                Map.of(
                        "ko", new EventRequest.EventTranslationRequest("정규수업", "정규수업 안내", "정규수업 설명"),
                        "en", new EventRequest.EventTranslationRequest("Regular Class", "Regular class notice", "Regular class description")
                )
        );
    }
}
