package com.lindyhopseoul.backend.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import java.time.Instant;

import com.lindyhopseoul.backend.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class MemberSettingsServiceTest {

    private MemberSettingsService memberSettingsService;
    private Member member;

    @BeforeEach
    void setUp() {
        memberSettingsService = new MemberSettingsService(mock(MemberRepository.class));
        member = Member.createGoogle(
                "google-sub-1",
                "user@example.com",
                "Google User",
                Instant.parse("2026-06-23T00:00:00Z")
        );
    }

    @Test
    void updateSettingsTrimsNicknameAndUpdatesPreferredLanguage() {
        MemberSettingsResponse response = memberSettingsService.updateSettings(
                member,
                new MemberSettingsUpdateRequest("  감자  ", "en")
        );

        assertThat(response.nickname()).isEqualTo("감자");
        assertThat(response.preferredLanguage()).isEqualTo(MemberPreferredLanguage.EN);
        assertThat(member.getNickname()).isEqualTo("감자");
        assertThat(member.getPreferredLanguage()).isEqualTo(MemberPreferredLanguage.EN);
    }

    @Test
    void updateSettingsClearsBlankNicknameWithoutSavingEmptyString() {
        memberSettingsService.updateSettings(member, new MemberSettingsUpdateRequest("Jay", "KO"));

        MemberSettingsResponse response = memberSettingsService.updateSettings(
                member,
                new MemberSettingsUpdateRequest("   ", "KO")
        );

        assertThat(response.nickname()).isNull();
        assertThat(member.getNickname()).isNull();
    }

    @Test
    void updateSettingsRejectsTooShortNickname() {
        assertThatThrownBy(() -> memberSettingsService.updateSettings(
                member,
                new MemberSettingsUpdateRequest("J", "KO")
        )).isInstanceOf(BadRequestException.class);
    }

    @Test
    void updateSettingsRejectsTooLongNickname() {
        assertThatThrownBy(() -> memberSettingsService.updateSettings(
                member,
                new MemberSettingsUpdateRequest("123456789012345678901", "KO")
        )).isInstanceOf(BadRequestException.class);
    }

    @Test
    void updateSettingsRejectsUnknownPreferredLanguage() {
        assertThatThrownBy(() -> memberSettingsService.updateSettings(
                member,
                new MemberSettingsUpdateRequest("Jay", "JP")
        )).isInstanceOf(BadRequestException.class);
    }
}
