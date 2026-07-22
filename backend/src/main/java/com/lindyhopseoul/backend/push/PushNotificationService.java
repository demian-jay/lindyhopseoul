package com.lindyhopseoul.backend.push;

import java.security.Security;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import jakarta.annotation.PostConstruct;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Sends web-push notifications and owns the subscription + per-user preference
 * rows behind them. Sending is a side effect: it must never throw into the
 * business flow that triggered it, so every failure here is swallowed and logged.
 *
 * <p>With no VAPID keys configured the whole feature is dormant — subscribing
 * still records a device, but sends are skipped rather than erroring.
 */
@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    private final PushSubscriptionRepository subscriptionRepository;
    private final UserNotificationSettingRepository settingRepository;

    private final String vapidPublicKey;
    private final String vapidPrivateKey;
    private final String vapidSubject;

    private PushService pushService;

    public PushNotificationService(
            PushSubscriptionRepository subscriptionRepository,
            UserNotificationSettingRepository settingRepository,
            @Value("${app.push.vapid.public-key:}") String vapidPublicKey,
            @Value("${app.push.vapid.private-key:}") String vapidPrivateKey,
            @Value("${app.push.vapid.subject:mailto:admin@swingpopseoul.com}") String vapidSubject
    ) {
        this.subscriptionRepository = subscriptionRepository;
        this.settingRepository = settingRepository;
        this.vapidPublicKey = vapidPublicKey;
        this.vapidPrivateKey = vapidPrivateKey;
        this.vapidSubject = vapidSubject;
    }

    @PostConstruct
    void init() {
        if (vapidPublicKey.isBlank() || vapidPrivateKey.isBlank()) {
            log.info("Web push disabled: no VAPID keys configured.");
            return;
        }
        try {
            Security.addProvider(new BouncyCastleProvider());
            pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
            log.info("Web push enabled.");
        } catch (Exception exception) {
            log.error("Web push could not start; sends will be skipped.", exception);
        }
    }

    public boolean isEnabled() {
        return pushService != null;
    }

    public String publicKey() {
        return vapidPublicKey;
    }

    // --- Subscriptions -----------------------------------------------------

    @Transactional
    public void saveSubscription(String userId, String endpoint, String p256dh, String auth) {
        subscriptionRepository.findByEndpoint(endpoint)
                .ifPresentOrElse(
                        existing -> existing.refresh(userId, p256dh, auth),
                        () -> subscriptionRepository.save(new PushSubscription(userId, endpoint, p256dh, auth))
                );
    }

    @Transactional
    public void deleteSubscription(String endpoint) {
        subscriptionRepository.deleteByEndpoint(endpoint);
    }

    // --- Preferences -------------------------------------------------------

    @Transactional(readOnly = true)
    public UserNotificationSetting settingsFor(String userId) {
        return settingRepository.findByUserId(userId)
                .orElseGet(() -> UserNotificationSetting.defaultsFor(userId));
    }

    @Transactional
    public UserNotificationSetting updateSettings(
            String userId,
            boolean newApplication,
            boolean lessonReminder,
            boolean memberMessage,
            boolean operationCheckTagged,
            boolean operationCheckCompleted
    ) {
        UserNotificationSetting setting = settingRepository.findByUserId(userId)
                .orElseGet(() -> UserNotificationSetting.defaultsFor(userId));
        setting.update(newApplication, lessonReminder, memberMessage, operationCheckTagged, operationCheckCompleted);
        return settingRepository.save(setting);
    }

    // --- Sending -----------------------------------------------------------

    /**
     * Sends to every one of the given users whose preference for {@code type} is
     * on. Deduplicates recipients so a user tagged twice is not pushed twice.
     */
    @Transactional
    public void send(Collection<String> userIds, NotificationType type, String title, String body, String url) {
        if (!isEnabled() || userIds == null || userIds.isEmpty()) {
            return;
        }
        Set<String> recipients = new LinkedHashSet<>(userIds);
        recipients.removeIf(id -> id == null || id.isBlank());
        recipients.removeIf(id -> !type.isEnabledFor(settingsFor(id)));
        if (recipients.isEmpty()) {
            return;
        }

        String payload = payload(title, body, url);
        for (PushSubscription subscription : subscriptionRepository.findByUserIdIn(List.copyOf(recipients))) {
            deliver(subscription, payload);
        }
    }

    public void sendToUser(String userId, NotificationType type, String title, String body, String url) {
        send(List.of(userId), type, title, body, url);
    }

    private void deliver(PushSubscription subscription, String payload) {
        try {
            Subscription target = new Subscription(
                    subscription.getEndpoint(),
                    new Subscription.Keys(subscription.getP256dh(), subscription.getAuth())
            );
            HttpResponse response = pushService.send(new Notification(target, payload));
            int status = response.getStatusLine().getStatusCode();
            // 404/410 mean the browser dropped the subscription; stop pushing to it.
            if (status == 404 || status == 410) {
                subscriptionRepository.deleteByEndpoint(subscription.getEndpoint());
            } else if (status >= 400) {
                log.warn("Push send returned {} for endpoint {}", status, subscription.getEndpoint());
            }
        } catch (Exception exception) {
            log.warn("Push send failed for endpoint {}", subscription.getEndpoint(), exception);
        }
    }

    // The payload is three short fields the service worker reads back, so it is
    // cheaper to hand-build the JSON than to pull in a serializer.
    private String payload(String title, String body, String url) {
        StringBuilder json = new StringBuilder("{\"title\":\"").append(escape(title))
                .append("\",\"body\":\"").append(escape(body)).append("\"");
        if (url != null && !url.isBlank()) {
            json.append(",\"url\":\"").append(escape(url)).append("\"");
        }
        return json.append("}").toString();
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t");
    }
}
