package com.lindyhopseoul.backend.push;

import jakarta.validation.constraints.NotBlank;

/**
 * Shape of a browser PushSubscription's JSON ({@code subscription.toJSON()}):
 * an endpoint plus the two encryption keys. {@code timeZone} is added by the
 * admin app — the IANA zone the subscribing device is in, which is what quiet
 * hours are measured against. Absent or unparseable, the account keeps whatever
 * zone it already had.
 */
public record PushSubscriptionRequest(
        @NotBlank String endpoint,
        Keys keys,
        String timeZone
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
