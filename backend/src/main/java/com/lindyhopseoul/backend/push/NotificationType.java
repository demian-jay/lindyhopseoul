package com.lindyhopseoul.backend.push;

import java.util.function.Function;

/**
 * The five push-notification kinds, split by the role they belong to. Each knows
 * how to read its own on/off flag off a {@link UserNotificationSetting}, so a
 * send can be gated by the recipient's preference without a switch per call site.
 */
public enum NotificationType {

    // Teacher
    NEW_APPLICATION(UserNotificationSetting::isNewApplication),
    LESSON_REMINDER(UserNotificationSetting::isLessonReminder),

    // Staff
    MEMBER_MESSAGE(UserNotificationSetting::isMemberMessage),
    OPERATION_CHECK_TAGGED(UserNotificationSetting::isOperationCheckTagged),
    OPERATION_CHECK_COMPLETED(UserNotificationSetting::isOperationCheckCompleted);

    private final Function<UserNotificationSetting, Boolean> enabled;

    NotificationType(Function<UserNotificationSetting, Boolean> enabled) {
        this.enabled = enabled;
    }

    public boolean isEnabledFor(UserNotificationSetting setting) {
        return setting != null && Boolean.TRUE.equals(enabled.apply(setting));
    }
}
