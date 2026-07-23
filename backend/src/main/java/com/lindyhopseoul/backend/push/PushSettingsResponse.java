package com.lindyhopseoul.backend.push;

import java.util.List;

import com.lindyhopseoul.backend.admin.AdminRole;

/**
 * The current user's toggle values, plus the roles they hold (so the UI shows
 * only the relevant toggles) and whether the server can actually send (VAPID
 * configured). The quiet window's hours are fixed (22:00-08:00) and named by the
 * screen's own copy; the zone they are measured in travels, because it is taken
 * from the device and so is the one thing the reader cannot infer.
 */
public record PushSettingsResponse(
        boolean newApplication,
        boolean lessonReminder,
        boolean memberMessage,
        boolean operationCheckTagged,
        boolean operationCheckCompleted,
        boolean quietHours,
        String quietHoursZone,
        List<AdminRole> roles,
        boolean pushConfigured
) {
    public static PushSettingsResponse of(UserNotificationSetting setting, List<AdminRole> roles, boolean pushConfigured) {
        return new PushSettingsResponse(
                setting.isNewApplication(),
                setting.isLessonReminder(),
                setting.isMemberMessage(),
                setting.isOperationCheckTagged(),
                setting.isOperationCheckCompleted(),
                setting.isQuietHours(),
                PushNotificationService.zoneOf(setting).getId(),
                roles,
                pushConfigured
        );
    }
}
