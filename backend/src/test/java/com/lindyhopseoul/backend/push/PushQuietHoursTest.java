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
}
