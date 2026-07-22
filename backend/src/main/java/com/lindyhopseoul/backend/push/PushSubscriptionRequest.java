package com.lindyhopseoul.backend.push;

import jakarta.validation.constraints.NotBlank;

/**
 * Shape of a browser PushSubscription's JSON ({@code subscription.toJSON()}):
 * an endpoint plus the two encryption keys.
 */
public record PushSubscriptionRequest(
        @NotBlank String endpoint,
        Keys keys
) {
    public record Keys(String p256dh, String auth) {
    }

    public String p256dh() {
        return keys == null ? null : keys.p256dh();
    }

    public String auth() {
        return keys == null ? null : keys.auth();
    }
}
