package com.lindyhopseoul.backend.eventmanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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

    private EventManagementService service;
    private AdminPrincipal superAdmin;

    @BeforeEach
    void setUp() {
        service = new EventManagementService(
                eventRepository,
                lessonRepository,
                messageTemplateRepository,
                teacherUserRepository,
                eventApplicationRepository
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
}
