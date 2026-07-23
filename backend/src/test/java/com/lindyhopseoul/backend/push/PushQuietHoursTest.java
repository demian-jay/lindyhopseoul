package com.lindyhopseoul.backend.push;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.ZoneId;
import java.time.ZonedDateTime;

import org.junit.jupiter.api.Test;

class PushQuietHoursTest {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private ZonedDateTime at(int hour, int minute) {
        return ZonedDateTime.of(2026, 7, 22, hour, minute, 0, 0, SEOUL);
    }

    @Test
    void isQuietFromTenAtNight() {
        assertThat(PushNotificationService.isWithinQuietHours(at(21, 59))).isFalse();
        assertThat(PushNotificationService.isWithinQuietHours(at(22, 0))).isTrue();
        assertThat(PushNotificationService.isWithinQuietHours(at(23, 59))).isTrue();
    }

    @Test
    void staysQuietAcrossMidnightUntilEight() {
        assertThat(PushNotificationService.isWithinQuietHours(at(0, 0))).isTrue();
        assertThat(PushNotificationService.isWithinQuietHours(at(7, 59))).isTrue();
        assertThat(PushNotificationService.isWithinQuietHours(at(8, 0))).isFalse();
    }

    @Test
    void isNotQuietDuringTheDay() {
        assertThat(PushNotificationService.isWithinQuietHours(at(8, 1))).isFalse();
        assertThat(PushNotificationService.isWithinQuietHours(at(14, 30))).isFalse();
    }

    @Test
    void fallsBackToSeoulWhenNoDeviceHasReportedAZone() {
        UserNotificationSetting setting = UserNotificationSetting.defaultsFor("U1");

        assertThat(PushNotificationService.zoneOf(setting)).isEqualTo(SEOUL);
    }

    @Test
    void usesTheZoneTheSubscribingDeviceReported() {
        UserNotificationSetting setting = UserNotificationSetting.defaultsFor("U1");
        setting.rememberQuietHoursZone("Europe/Berlin");

        assertThat(PushNotificationService.zoneOf(setting)).isEqualTo(ZoneId.of("Europe/Berlin"));
    }

    @Test
    void ignoresAZoneItCannotParse() {
        UserNotificationSetting setting = UserNotificationSetting.defaultsFor("U1");
        setting.rememberQuietHoursZone("Middle/Earth");

        assertThat(PushNotificationService.zoneOf(setting)).isEqualTo(SEOUL);
    }

    // The same instant is inside one person's night and outside another's: 02:00
    // in Berlin is 09:00 the same day in Seoul, so a Berlin-based staffer is
    // quiet while a Seoul one is already at work.
    @Test
    void measuresTheWindowInEachRecipientsOwnZone() {
        ZonedDateTime berlinNight = ZonedDateTime.of(2026, 7, 23, 2, 0, 0, 0, ZoneId.of("Europe/Berlin"));

        assertThat(PushNotificationService.isWithinQuietHours(berlinNight)).isTrue();
        assertThat(PushNotificationService.isWithinQuietHours(berlinNight.withZoneSameInstant(SEOUL))).isFalse();
    }
}
