package com.lindyhopseoul.backend.push;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Turns a {@link PushSendRequestedEvent} into an actual send, but only after the
 * triggering transaction commits — a rolled-back application or message must not
 * notify anyone. Runs async so push I/O never sits on the request thread.
 */
@Component
public class PushNotificationListener {

    private final PushNotificationService pushNotificationService;

    public PushNotificationListener(PushNotificationService pushNotificationService) {
        this.pushNotificationService = pushNotificationService;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPushRequested(PushSendRequestedEvent event) {
        pushNotificationService.send(event.userIds(), event.type(), event.title(), event.body(), event.url());
    }
}
