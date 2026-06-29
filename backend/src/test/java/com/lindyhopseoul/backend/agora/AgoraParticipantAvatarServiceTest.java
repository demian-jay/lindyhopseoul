package com.lindyhopseoul.backend.agora;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import com.lindyhopseoul.backend.eventmanagement.ApplicationContactMethod;
import com.lindyhopseoul.backend.eventmanagement.ApplicationDanceRole;
import com.lindyhopseoul.backend.eventmanagement.Event;
import com.lindyhopseoul.backend.eventmanagement.EventApplication;
import com.lindyhopseoul.backend.eventmanagement.EventApplicationRepository;
import com.lindyhopseoul.backend.eventmanagement.EventStatus;
import com.lindyhopseoul.backend.eventmanagement.EventTranslation;
import com.lindyhopseoul.backend.eventmanagement.EventType;
import com.lindyhopseoul.backend.eventmanagement.Lesson;
import com.lindyhopseoul.backend.eventmanagement.LessonScheduleType;
import com.lindyhopseoul.backend.eventmanagement.LessonStatus;
import com.lindyhopseoul.backend.eventmanagement.LessonTranslation;
import com.lindyhopseoul.backend.eventmanagement.LessonType;
import com.lindyhopseoul.backend.member.Member;
import com.lindyhopseoul.backend.member.MemberPreferredLanguage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;

class AgoraParticipantAvatarServiceTest {

    private EventApplicationRepository eventApplicationRepository;
    private AgoraParticipantAvatarService service;

    @BeforeEach
    void setUp() {
        eventApplicationRepository = Mockito.mock(EventApplicationRepository.class);
        service = new AgoraParticipantAvatarService(
                eventApplicationRepository,
                Clock.fixed(Instant.parse("2026-06-29T00:00:00Z"), ZoneId.of("Asia/Seoul"))
        );
    }

    @Test
    void findParticipantAvatarsUsesOnlySafeDisplayFieldsAndClassTitle() {
        Event event = event();
        Lesson lesson = lesson(event, "레벨 1 입문반");
        Member member = member(1L, "Mina");
        EventApplication application = application(event, lesson, member, ApplicationDanceRole.LEADER);
        when(eventApplicationRepository.findAgoraParticipantAvatarCandidates(LocalDate.of(2026, 6, 29)))
                .thenReturn(List.of(application));

        AgoraParticipantAvatarListResponse response = service.findParticipantAvatars();

        assertThat(response.additionalCount()).isZero();
        assertThat(response.avatars()).hasSize(1);
        AgoraParticipantAvatarResponse avatar = response.avatars().get(0);
        assertThat(avatar.id()).isEqualTo("participant-1");
        assertThat(avatar.memberId()).isEqualTo(1L);
        assertThat(avatar.nickname()).isEqualTo("Mina");
        assertThat(avatar.initial()).isEqualTo("M");
        assertThat(avatar.role()).isEqualTo("leader");
        assertThat(avatar.classTitle()).isEqualTo("레벨 1 입문반");
        assertThat(avatar.positionGroup()).isEqualTo("lesson");
    }

    @Test
    void findParticipantAvatarsDeduplicatesMembersAndReturnsAdditionalCount() {
        Event event = event();
        Lesson lesson = lesson(event, "레벨 1 입문반");
        List<EventApplication> applications = new ArrayList<>();
        Member firstMember = member(1L, "Mina");
        applications.add(application(event, lesson, firstMember, ApplicationDanceRole.LEADER));
        applications.add(application(event, lesson, firstMember, ApplicationDanceRole.FOLLOWER));
        for (long id = 2L; id <= 14L; id += 1) {
            applications.add(application(event, lesson, member(id, "D" + id), ApplicationDanceRole.BOTH));
        }
        when(eventApplicationRepository.findAgoraParticipantAvatarCandidates(LocalDate.of(2026, 6, 29)))
                .thenReturn(applications);

        AgoraParticipantAvatarListResponse response = service.findParticipantAvatars();

        assertThat(response.avatars()).hasSize(12);
        assertThat(response.additionalCount()).isEqualTo(2);
        assertThat(response.avatars())
                .extracting(AgoraParticipantAvatarResponse::memberId)
                .doesNotHaveDuplicates();
    }

    @Test
    void findParticipantAvatarsFallsBackToGenericNicknameWithoutRealName() {
        Event event = event();
        Member member = member(3L, null);
        member.updateSettings(null, MemberPreferredLanguage.EN);
        EventApplication application = application(event, null, member, null);
        when(eventApplicationRepository.findAgoraParticipantAvatarCandidates(LocalDate.of(2026, 6, 29)))
                .thenReturn(List.of(application));

        AgoraParticipantAvatarListResponse response = service.findParticipantAvatars();

        AgoraParticipantAvatarResponse avatar = response.avatars().get(0);
        assertThat(avatar.nickname()).isEqualTo("Member");
        assertThat(avatar.initial()).isEqualTo("M");
        assertThat(avatar.classTitle()).isEqualTo("스윙팝 정규수업");
        assertThat(avatar.positionGroup()).isEqualTo("event");
    }

    private Event event() {
        Event event = Event.create(
                EventType.REGULAR_CLASS,
                LocalDate.of(2026, 6, 22),
                LocalDate.of(2026, 7, 13),
                LocalTime.of(14, 0),
                LocalTime.of(17, 0),
                "Swingpop Studio",
                EventStatus.PUBLISHED,
                10
        );
        event.replaceTranslations(Set.of(
                new EventTranslation("ko", "스윙팝 정규수업", "정규수업 안내", "이벤트 설명"),
                new EventTranslation("en", "Swingpop Regular Class", "Regular class notice", "Event description")
        ));
        ReflectionTestUtils.setField(event, "id", 10L);
        return event;
    }

    private Lesson lesson(Event event, String title) {
        Lesson lesson = Lesson.create(
                event,
                LessonType.LEVEL1,
                LessonScheduleType.PERIOD,
                LocalDate.of(2026, 6, 22),
                LocalDate.of(2026, 7, 13),
                LocalTime.of(14, 0),
                LocalTime.of(15, 20),
                new BigDecimal("80000"),
                "KRW",
                LessonStatus.PUBLISHED,
                10
        );
        lesson.replaceTranslations(Set.of(
                new LessonTranslation("ko", title, "수업 설명"),
                new LessonTranslation("en", "Level 1", "Lesson description")
        ));
        ReflectionTestUtils.setField(lesson, "id", 20L);
        return lesson;
    }

    private EventApplication application(
            Event event,
            Lesson lesson,
            Member member,
            ApplicationDanceRole danceRole
    ) {
        return EventApplication.create(
                event,
                lesson,
                member,
                "Real Name Should Not Be Exposed",
                ApplicationContactMethod.EMAIL,
                "private@example.com",
                "",
                "ko",
                danceRole
        );
    }

    private Member member(Long id, String nickname) {
        Member member = Member.createGoogle(
                "google-sub-" + id,
                "member" + id + "@example.com",
                "Private Real Name " + id,
                Instant.parse("2026-06-23T00:00:00Z")
        );
        member.updateSettings(nickname, MemberPreferredLanguage.KO);
        ReflectionTestUtils.setField(member, "id", id);
        return member;
    }
}
