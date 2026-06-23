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
import java.util.Optional;

import com.lindyhopseoul.backend.exception.BadRequestException;
import com.lindyhopseoul.backend.exception.ConflictException;
import com.lindyhopseoul.backend.member.Member;
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
                " 수업 전에 신발을 가져가야 하나요? ",
                "en",
                null
        ));

        ArgumentCaptor<EventApplication> applicationCaptor = ArgumentCaptor.forClass(EventApplication.class);
        verify(eventApplicationRepository).save(applicationCaptor.capture());
        EventApplication application = applicationCaptor.getValue();
        assertThat(application.getApplicantName()).isEqualTo("Alex");
        assertThat(application.getContactMethod()).isEqualTo(ApplicationContactMethod.WHATSAPP);
        assertThat(application.getContactValue()).isEqualTo("+82 10 1234 5678");
        assertThat(application.getRequestMemo()).isEqualTo("수업 전에 신발을 가져가야 하나요?");
        assertThat(application.getDanceRole()).isNull();
        assertThat(response.requestMemo()).isEqualTo("수업 전에 신발을 가져가야 하나요?");
        assertThat(response.languageCode()).isEqualTo("en");
        verify(eventApplicationRepository, never()).countByMemberIdAndApplicationTarget(any(), any(), any());
    }

    @Test
    void createAllowsApplicationWithoutContactValue() {
        Event event = event(EventStatus.PUBLISHED);
        Lesson lesson = lesson(event, LessonStatus.PUBLISHED);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event));
        when(lessonRepository.findDetailsById(2L)).thenReturn(Optional.of(lesson));
        when(eventApplicationRepository.save(any(EventApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.create(new EventApplicationCreateRequest(
                1L,
                2L,
                "Alex",
                null,
                null,
                "답변이 필요하면 카카오톡 ID를 함께 적습니다.",
                "ko",
                null
        ));

        ArgumentCaptor<EventApplication> applicationCaptor = ArgumentCaptor.forClass(EventApplication.class);
        verify(eventApplicationRepository).save(applicationCaptor.capture());
        EventApplication application = applicationCaptor.getValue();
        assertThat(application.getContactMethod()).isEqualTo(ApplicationContactMethod.KAKAO_TALK);
        assertThat(application.getContactValue()).isEmpty();
        assertThat(application.getRequestMemo()).isEqualTo("답변이 필요하면 카카오톡 ID를 함께 적습니다.");
    }

    @Test
    void createStoresBothDanceRoleWhenLessonRequiresRoleSelection() {
        Event event = event(EventStatus.PUBLISHED);
        Lesson lesson = lesson(event, LessonStatus.PUBLISHED, true);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event));
        when(lessonRepository.findDetailsById(2L)).thenReturn(Optional.of(lesson));
        when(eventApplicationRepository.save(any(EventApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventApplicationResponse response = service.create(new EventApplicationCreateRequest(
                1L,
                2L,
                "Alex",
                ApplicationContactMethod.EMAIL,
                "alex@example.com",
                "",
                "en",
                ApplicationDanceRole.BOTH
        ));

        ArgumentCaptor<EventApplication> applicationCaptor = ArgumentCaptor.forClass(EventApplication.class);
        verify(eventApplicationRepository).save(applicationCaptor.capture());
        assertThat(applicationCaptor.getValue().getDanceRole()).isEqualTo(ApplicationDanceRole.BOTH);
        assertThat(response.danceRole()).isEqualTo(ApplicationDanceRole.BOTH);
    }

    @Test
    void createLinksCurrentMemberWhenLoggedIn() {
        Event event = event(EventStatus.PUBLISHED);
        Lesson lesson = lesson(event, LessonStatus.PUBLISHED);
        Member member = member(7L);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event));
        when(lessonRepository.findDetailsById(2L)).thenReturn(Optional.of(lesson));
        when(eventApplicationRepository.save(any(EventApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.create(new EventApplicationCreateRequest(
                1L,
                2L,
                "Alex",
                ApplicationContactMethod.EMAIL,
                "alex@example.com",
                "",
                "en",
                null
        ), member);

        ArgumentCaptor<EventApplication> applicationCaptor = ArgumentCaptor.forClass(EventApplication.class);
        verify(eventApplicationRepository).save(applicationCaptor.capture());
        EventApplication application = applicationCaptor.getValue();
        assertThat(application.getMember()).isEqualTo(member);
    }

    @Test
    void createUsesCurrentMemberNicknameWhenLoggedIn() {
        Event event = event(EventStatus.PUBLISHED);
        Lesson lesson = lesson(event, LessonStatus.PUBLISHED);
        Member member = member(7L);
        member.updateSettings(" Swing Potato ", null);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event));
        when(lessonRepository.findDetailsById(2L)).thenReturn(Optional.of(lesson));
        when(eventApplicationRepository.save(any(EventApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.create(new EventApplicationCreateRequest(
                1L,
                2L,
                "Manipulated Name",
                ApplicationContactMethod.EMAIL,
                "alex@example.com",
                "",
                "en",
                null
        ), member);

        ArgumentCaptor<EventApplication> applicationCaptor = ArgumentCaptor.forClass(EventApplication.class);
        verify(eventApplicationRepository).save(applicationCaptor.capture());
        assertThat(applicationCaptor.getValue().getApplicantName()).isEqualTo("Swing Potato");
    }

    @Test
    void createRejectsBlankGuestApplicantName() {
        Event event = event(EventStatus.PUBLISHED);
        Lesson lesson = lesson(event, LessonStatus.PUBLISHED);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event));
        when(lessonRepository.findDetailsById(2L)).thenReturn(Optional.of(lesson));

        assertThatThrownBy(() -> service.create(new EventApplicationCreateRequest(
                1L,
                2L,
                " ",
                ApplicationContactMethod.EMAIL,
                "alex@example.com",
                "",
                "en",
                null
        ))).isInstanceOf(BadRequestException.class);

        verify(eventApplicationRepository, never()).save(any(EventApplication.class));
    }

    @Test
    void createRejectsDuplicateApplicationForLoggedInMember() {
        Event event = event(EventStatus.PUBLISHED);
        Lesson lesson = lesson(event, LessonStatus.PUBLISHED);
        Member member = member(7L);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event));
        when(lessonRepository.findDetailsById(2L)).thenReturn(Optional.of(lesson));
        when(eventApplicationRepository.countByMemberIdAndApplicationTarget(7L, 1L, 2L)).thenReturn(1L);

        assertThatThrownBy(() -> service.create(new EventApplicationCreateRequest(
                1L,
                2L,
                "Alex",
                ApplicationContactMethod.EMAIL,
                "alex@example.com",
                "",
                "en",
                null
        ), member)).isInstanceOf(ConflictException.class);

        verify(eventApplicationRepository, never()).save(any(EventApplication.class));
    }

    @Test
    void createRejectsDuplicateEventApplicationForLoggedInMember() {
        Event event = event(EventStatus.PUBLISHED);
        Member member = member(7L);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event));
        when(eventApplicationRepository.countByMemberIdAndApplicationTarget(7L, 1L, null)).thenReturn(1L);

        assertThatThrownBy(() -> service.create(new EventApplicationCreateRequest(
                1L,
                null,
                "Alex",
                ApplicationContactMethod.EMAIL,
                "alex@example.com",
                "",
                "en",
                null
        ), member)).isInstanceOf(ConflictException.class);

        verify(eventApplicationRepository, never()).save(any(EventApplication.class));
    }

    @Test
    void createRejectsMissingDanceRoleWhenLessonRequiresRoleSelection() {
        Event event = event(EventStatus.PUBLISHED);
        Lesson lesson = lesson(event, LessonStatus.PUBLISHED, true);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event));
        when(lessonRepository.findDetailsById(2L)).thenReturn(Optional.of(lesson));

        assertThatThrownBy(() -> service.create(new EventApplicationCreateRequest(
                1L,
                2L,
                "Alex",
                ApplicationContactMethod.EMAIL,
                "alex@example.com",
                "",
                "en",
                null
        ))).isInstanceOf(ConflictException.class);
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
                "",
                "en",
                null
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
        return lesson(event, status, false);
    }

    private Lesson lesson(Event event, LessonStatus status, boolean roleSelectionEnabled) {
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
                10,
                roleSelectionEnabled
        );
        ReflectionTestUtils.setField(lesson, "id", 2L);
        return lesson;
    }

    private Member member(Long id) {
        Member member = Member.createGoogle("google-sub-" + id, "alex@example.com", "Alex", Instant.now());
        ReflectionTestUtils.setField(member, "id", id);
        return member;
    }
}
