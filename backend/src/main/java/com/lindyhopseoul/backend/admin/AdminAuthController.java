package com.lindyhopseoul.backend.admin;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

    private final AdminAuthService adminAuthService;
    private final AdminSessionService adminSessionService;

    public AdminAuthController(
            AdminAuthService adminAuthService,
            AdminSessionService adminSessionService
    ) {
        this.adminAuthService = adminAuthService;
        this.adminSessionService = adminSessionService;
    }

    @PostMapping("/login")
    public AdminAuthResponse login(@Valid @RequestBody AdminLoginRequest request) {
        return adminAuthService.login(request);
    }

    @GetMapping("/me")
    public AdminMeResponse me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return AdminMeResponse.from(adminSessionService.requirePrincipal(authorization));
    }

    @PostMapping("/me/password")
    public AdminMeResponse changeOwnPassword(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody AdminPasswordChangeRequest request
    ) {
        AdminPrincipal actor = adminSessionService.requirePrincipal(authorization);
        AdminPrincipal updated = adminAuthService.changeOwnPassword(actor, request);
        // Nothing to push back into the session: it stores the account id only, so
        // the next request reads the cleared flag straight off the account and the
        // interceptor stops blocking.
        return AdminMeResponse.from(updated);
    }

    @GetMapping("/me/login-id/available")
    public AdminLoginIdAvailabilityResponse checkLoginIdAvailable(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam("loginId") String loginId
    ) {
        AdminPrincipal actor = adminSessionService.requirePrincipal(authorization);
        return new AdminLoginIdAvailabilityResponse(adminAuthService.isLoginIdAvailable(actor, loginId));
    }

    @PostMapping("/me/login-id")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeOwnLoginId(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody AdminLoginIdChangeRequest request
    ) {
        AdminPrincipal actor = adminSessionService.requirePrincipal(authorization);
        adminAuthService.changeOwnLoginId(actor, request);
        // The client is made to sign in again under the new ID, so end the session
        // rather than leave a live token behind for the old one.
        adminSessionService.clearSession(authorization);
    }

    @PostMapping("/me/language")
    public AdminMeResponse changeOwnLanguage(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody AdminLanguageChangeRequest request
    ) {
        AdminPrincipal actor = adminSessionService.requirePrincipal(authorization);
        AdminPrincipal updated = adminAuthService.changeOwnLanguage(actor, request);
        return AdminMeResponse.from(updated);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        adminSessionService.clearSession(authorization);
    }
}
