package com.lindyhopseoul.backend.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
import com.lindyhopseoul.backend.exception.ForbiddenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AdminMemberManagementServiceTest {

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private EventApplicationRepository eventApplicationRepository;

    private AdminMemberManagementService service;

    @BeforeEach
    void setUp() {
        service = new AdminMemberManagementService(memberRepository, eventApplicationRepository);
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
