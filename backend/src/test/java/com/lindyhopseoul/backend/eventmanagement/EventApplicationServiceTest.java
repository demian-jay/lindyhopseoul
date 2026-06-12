package com.lindyhopseoul.backend.eventmanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import com.lindyhopseoul.backend.exception.ConflictException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class EventApplicationServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private LessonRepository lessonRepository;

    @Mock
    private EventApplicationRepository eventApplicationRepository;

    private EventApplicationService service;

    @BeforeEach
    void setUp() {
        service = new EventApplicationService(eventRepository, lessonRepository, eventApplicationRepository);
    }

    @Test
    void createStoresSimpleApplicationForPublishedLesson() {
        Event event = event(EventStatus.PUBLISHED);
        Lesson lesson = lesson(event, LessonStatus.PUBLISHED);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event));
        when(lessonRepository.findDetailsById(2L)).thenReturn(Optional.of(lesson));
        when(eventApplicationRepository.save(any(EventApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventApplicationResponse response = service.create(new EventApplicationCreateRequest(
                1L,
                2L,
                " Alex ",
                ApplicationContactMethod.WHATSAPP,
                " +82 10 1234 5678 ",
                "en"
        ));

        ArgumentCaptor<EventApplication> applicationCaptor = ArgumentCaptor.forClass(EventApplication.class);
        verify(eventApplicationRepository).save(applicationCaptor.capture());
        EventApplication application = applicationCaptor.getValue();
        assertThat(application.getApplicantName()).isEqualTo("Alex");
        assertThat(application.getContactMethod()).isEqualTo(ApplicationContactMethod.WHATSAPP);
        assertThat(application.getContactValue()).isEqualTo("+82 10 1234 5678");
        assertThat(response.languageCode()).isEqualTo("en");
    }

    @Test
    void createRejectsFinishedLesson() {
        Event event = event(EventStatus.PUBLISHED);
        Lesson lesson = lesson(event, LessonStatus.FINISHED);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event));
        when(lessonRepository.findDetailsById(2L)).thenReturn(Optional.of(lesson));

        assertThatThrownBy(() -> service.create(new EventApplicationCreateRequest(
                1L,
                2L,
                "Alex",
                ApplicationContactMethod.EMAIL,
                "alex@example.com",
                "en"
        ))).isInstanceOf(ConflictException.class);
    }

    private Event event(EventStatus status) {
        Event event = Event.create(
                EventType.REGULAR_CLASS,
                LocalDate.of(2026, 7, 6),
                LocalDate.of(2026, 7, 27),
                LocalTime.of(14, 0),
                LocalTime.of(17, 0),
                "Swingpop Studio",
                status,
                10
        );
        ReflectionTestUtils.setField(event, "id", 1L);
        return event;
    }

    private Lesson lesson(Event event, LessonStatus status) {
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
                status,
                10
        );
        ReflectionTestUtils.setField(lesson, "id", 2L);
        return lesson;
    }
}
