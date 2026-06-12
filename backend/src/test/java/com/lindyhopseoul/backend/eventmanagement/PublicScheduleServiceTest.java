package com.lindyhopseoul.backend.eventmanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PublicScheduleServiceTest {

    @Mock
    private EventRepository eventRepository;

    private PublicScheduleService service;

    @BeforeEach
    void setUp() {
        service = new PublicScheduleService(eventRepository);
    }

    @Test
    void findOpenSchedulesReturnsPublishedLessonsWithActualDescriptions() {
        LocalDate from = LocalDate.of(2026, 7, 1);
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
        event.replaceTranslations(Set.of(
                new EventTranslation("ko", "스윙팝 토요 정규수업", "정규수업 안내", "이벤트 설명"),
                new EventTranslation("en", "Swingpop Saturday Regular Class", "Regular class notice", "Event description")
        ));
        event.addLesson(lesson(
                LessonStatus.PUBLISHED,
                "Level 1 Beginner Class",
                "처음 스윙댄스를 시작하는 분을 위한 Level 1 입문 수업입니다."
        ));
        event.addLesson(lesson(
                LessonStatus.FINISHED,
                "Finished Class",
                "공개되면 안 되는 설명"
        ));
        when(eventRepository.findPublishedDetails(from, null)).thenReturn(List.of(event));

        List<PublicScheduleItemResponse> schedules = service.findOpenSchedules(from, null);

        assertThat(schedules).hasSize(1);
        assertThat(schedules.get(0).lessonType()).isEqualTo(LessonType.LEVEL1);
        assertThat(schedules.get(0).translations().get("ko").description())
                .isEqualTo("처음 스윙댄스를 시작하는 분을 위한 Level 1 입문 수업입니다.");
        assertThat(schedules.get(0).recommendedForBeginners()).isTrue();
    }

    @Test
    void findOpenSchedulesPreservesLessonDisplayOrderBeforeStartTimeWithinEvent() {
        LocalDate from = LocalDate.of(2026, 7, 1);
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
        event.replaceTranslations(Set.of(
                new EventTranslation("ko", "스윙팝 토요 정규수업", "정규수업 안내", "이벤트 설명"),
                new EventTranslation("en", "Swingpop Saturday Regular Class", "Regular class notice", "Event description")
        ));
        event.addLesson(lesson(
                LessonStatus.PUBLISHED,
                LessonType.LEVEL2,
                LocalTime.of(17, 30),
                LocalTime.of(19, 0),
                10,
                "Level 2",
                "Level 2"
        ));
        event.addLesson(lesson(
                LessonStatus.PUBLISHED,
                LessonType.LEVEL1,
                LocalTime.of(19, 0),
                LocalTime.of(20, 0),
                1,
                "Level 1",
                "Level 1"
        ));
        when(eventRepository.findPublishedDetails(from, null)).thenReturn(List.of(event));

        List<PublicScheduleItemResponse> schedules = service.findOpenSchedules(from, null);

        assertThat(schedules).extracting(PublicScheduleItemResponse::lessonType)
                .containsExactly(LessonType.LEVEL1, LessonType.LEVEL2);
    }

    private Lesson lesson(LessonStatus status, String title, String description) {
        return lesson(
                status,
                LessonType.LEVEL1,
                LocalTime.of(14, 0),
                LocalTime.of(15, 20),
                10,
                title,
                description
        );
    }

    private Lesson lesson(
            LessonStatus status,
            LessonType lessonType,
            LocalTime startTime,
            LocalTime endTime,
            Integer displayOrder,
            String title,
            String description
    ) {
        Lesson lesson = Lesson.create(
                null,
                lessonType,
                LessonScheduleType.PERIOD,
                LocalDate.of(2026, 7, 6),
                LocalDate.of(2026, 7, 27),
                startTime,
                endTime,
                new BigDecimal("80000"),
                "KRW",
                status,
                displayOrder
        );
        lesson.replaceTranslations(Set.of(
                new LessonTranslation("ko", title, description),
                new LessonTranslation("en", title, description)
        ));
        return lesson;
    }
}
