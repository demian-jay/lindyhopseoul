package com.lindyhopseoul.backend.eventmanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class MemberClassApplicationServiceTest {

    @Mock
    private EventApplicationRepository eventApplicationRepository;

    private MemberClassApplicationService service;

    @BeforeEach
    void setUp() {
        service = new MemberClassApplicationService(eventApplicationRepository);
    }

    @Test
    void findAppliedIdsUsePublicScheduleItemIds() {
        Event event = event();
        Lesson lesson = lesson(event);
        EventApplication lessonApplication = application(event, lesson);
        EventApplication eventApplication = application(event, null);
        when(eventApplicationRepository.findByMember_IdOrderByCreatedAtDescIdDesc(7L))
                .thenReturn(List.of(lessonApplication, eventApplication));

        assertThat(service.findAppliedScheduleItemIds(7L))
                .containsExactly("lesson-2", "event-1");
        assertThat(service.findAppliedClassIds(7L))
                .containsExactly(2L, 1L);
    }

    private EventApplication application(Event event, Lesson lesson) {
        return EventApplication.create(
                event,
                lesson,
                null,
                "Alex",
                ApplicationContactMethod.EMAIL,
                "alex@example.com",
                "",
                "en",
                null
        );
    }

    private Event event() {
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
        ReflectionTestUtils.setField(event, "id", 1L);
        return event;
    }

    private Lesson lesson(Event event) {
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
                10,
                false
        );
        ReflectionTestUtils.setField(lesson, "id", 2L);
        return lesson;
    }
}
