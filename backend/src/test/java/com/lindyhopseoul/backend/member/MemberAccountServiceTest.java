package com.lindyhopseoul.backend.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import com.lindyhopseoul.backend.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class MemberAccountServiceTest {

    private static final Instant WITHDRAWN_AT = Instant.parse("2026-06-23T09:00:00Z");

    @Mock
    private MemberRepository memberRepository;

    private MemberAccountService memberAccountService;

    @BeforeEach
    void setUp() {
        memberAccountService = new MemberAccountService(
                memberRepository,
                Clock.fixed(WITHDRAWN_AT, ZoneOffset.UTC)
        );
    }

    @Test
    void withdrawMasksExternalIdentifiersButKeepsDisplayNames() {
        Member member = Member.createGoogle(
                "google-sub-1",
                "user@example.com",
                "Google Name",
                Instant.parse("2026-06-01T00:00:00Z")
        );
        ReflectionTestUtils.setField(member, "id", 123L);
        member.updateSettings("감자", MemberPreferredLanguage.EN);
        when(memberRepository.findById(123L)).thenReturn(Optional.of(member));

        memberAccountService.withdraw(123L);

        assertThat(member.getStatus()).isEqualTo(MemberStatus.WITHDRAWN);
        assertThat(member.getProvider()).isEqualTo(MemberProvider.WITHDRAWN);
        assertThat(member.getProviderId()).isEqualTo("withdrawn_123");
        assertThat(member.getEmail()).isEqualTo("withdrawn_member_123@swingpop.local");
        assertThat(member.getDisplayName()).isEqualTo("Google Name");
        assertThat(member.getNickname()).isEqualTo("감자");
        assertThat(member.getRole()).isEqualTo(MemberRole.USER);
        assertThat(member.getWithdrawnAt()).isEqualTo(WITHDRAWN_AT);
    }

    @Test
    void withdrawRejectsWithdrawnMember() {
        Member member = Member.createGoogle(
                "google-sub-1",
                "user@example.com",
                "Google Name",
                Instant.parse("2026-06-01T00:00:00Z")
        );
        ReflectionTestUtils.setField(member, "id", 123L);
        member.withdraw(WITHDRAWN_AT);
        when(memberRepository.findById(123L)).thenReturn(Optional.of(member));

        assertThatThrownBy(() -> memberAccountService.withdraw(123L))
                .isInstanceOf(UnauthorizedException.class);
    }
}
