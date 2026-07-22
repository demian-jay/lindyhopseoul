package com.lindyhopseoul.backend.push;

import java.util.List;

import com.lindyhopseoul.backend.admin.AdminRole;

/**
 * The current user's toggle values, plus the roles they hold (so the UI shows
 * only the relevant toggles) and whether the server can actually send (VAPID
 * configured). The quiet window itself is fixed (22:00-08:00), so only the
 * on/off flag travels — the screen names the hours in its own copy.
 */
public record PushSettingsResponse(
        boolean newApplication,
        boolean lessonReminder,
        boolean memberMessage,
        boolean operationCheckTagged,
        boolean operationCheckCompleted,
        boolean quietHours,
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
                roles,
                pushConfigured
        );
    }
}
