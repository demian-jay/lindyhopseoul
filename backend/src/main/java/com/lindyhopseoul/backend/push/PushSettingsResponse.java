package com.lindyhopseoul.backend.push;

import java.util.List;

import com.lindyhopseoul.backend.admin.AdminRole;

/**
 * The current user's toggle values, plus the roles they hold (so the UI shows
 * only the relevant toggles) and whether the server can actually send (VAPID
 * configured).
 */
public record PushSettingsResponse(
        boolean newApplication,
        boolean lessonReminder,
        boolean memberMessage,
        boolean operationCheckTagged,
        boolean operationCheckCompleted,
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
                roles,
                pushConfigured
        );
    }
}
