package com.lindyhopseoul.backend.push;

import java.util.List;

/**
 * Published by a business service once it has resolved who should be notified and
 * what to say. Recipients are resolved inside the triggering transaction (so lazy
 * associations still load); the actual send happens after commit — see
 * {@link PushNotificationListener}.
 */
public record PushSendRequestedEvent(
        List<String> userIds,
        NotificationType type,
        String title,
        String body,
        String url
) {
}
