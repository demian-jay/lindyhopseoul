package com.lindyhopseoul.backend.push;

import java.util.Map;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminSessionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/push")
public class PushController {

    private final AdminSessionService adminSessionService;
    private final PushNotificationService pushNotificationService;

    public PushController(
            AdminSessionService adminSessionService,
            PushNotificationService pushNotificationService
    ) {
        this.adminSessionService = adminSessionService;
        this.pushNotificationService = pushNotificationService;
    }

    @GetMapping("/vapid-public-key")
    public Map<String, String> vapidPublicKey(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        adminSessionService.requirePrincipal(authorization);
        return Map.of("publicKey", pushNotificationService.publicKey());
    }

    @PostMapping("/subscriptions")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void subscribe(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody PushSubscriptionRequest request
    ) {
        AdminPrincipal actor = adminSessionService.requirePrincipal(authorization);
        pushNotificationService.saveSubscription(
                actor.userCd(), request.endpoint(), request.p256dh(), request.auth(), request.timeZone());
    }

    @DeleteMapping("/subscriptions")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsubscribe(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody PushSubscriptionRequest request
    ) {
        adminSessionService.requirePrincipal(authorization);
        pushNotificationService.deleteSubscription(request.endpoint());
    }

    @GetMapping("/settings")
    public PushSettingsResponse settings(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        AdminPrincipal actor = adminSessionService.requirePrincipal(authorization);
        return PushSettingsResponse.of(
                pushNotificationService.settingsFor(actor.userCd()),
                actor.roles(),
                pushNotificationService.isEnabled()
        );
    }

    @PutMapping("/settings")
    public PushSettingsResponse updateSettings(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody PushSettingsUpdateRequest request
    ) {
        AdminPrincipal actor = adminSessionService.requirePrincipal(authorization);
        UserNotificationSetting updated = pushNotificationService.updateSettings(
                actor.userCd(),
                request.newApplication(),
                request.lessonReminder(),
                request.memberMessage(),
                request.operationCheckTagged(),
                request.operationCheckCompleted(),
                request.quietHours()
        );
        return PushSettingsResponse.of(updated, actor.roles(), pushNotificationService.isEnabled());
    }
}
