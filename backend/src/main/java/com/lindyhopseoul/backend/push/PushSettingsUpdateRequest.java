package com.lindyhopseoul.backend.push;

public record PushSettingsUpdateRequest(
        boolean newApplication,
        boolean lessonReminder,
        boolean memberMessage,
        boolean operationCheckTagged,
        boolean operationCheckCompleted
) {
}
