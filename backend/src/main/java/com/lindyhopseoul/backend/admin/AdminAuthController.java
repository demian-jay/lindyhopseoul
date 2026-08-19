package com.lindyhopseoul.backend.admin;

import com.lindyhopseoul.backend.auth.CurrentMemberService;
import jakarta.servlet.http.HttpServletRequest;
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
    private final AdminGoogleSignInService adminGoogleSignInService;
    private final CurrentMemberService currentMemberService;

    public AdminAuthController(
            AdminAuthService adminAuthService,
            AdminSessionService adminSessionService,
            AdminGoogleSignInService adminGoogleSignInService,
            CurrentMemberService currentMemberService
    ) {
        this.adminAuthService = adminAuthService;
        this.adminSessionService = adminSessionService;
        this.adminGoogleSignInService = adminGoogleSignInService;
        this.currentMemberService = currentMemberService;
    }

    @PostMapping("/login")
    public AdminAuthResponse login(@Valid @RequestBody AdminLoginRequest request) {
        return adminAuthService.login(request);
    }

    /**
     * Signs in with the member session this request already carries, for staff
     * whose Google member account has been linked to theirs.
     *
     * <p>Carries no admin token — it is how one is obtained — so it sits in
     * {@link AdminApiAuthInterceptor}'s anonymous allowlist next to
     * {@code /login}. It is not unauthenticated: the member session cookie is the
     * credential, and {@code requireCurrentMemberId} rejects the request without
     * a live one.
     *
     * <p>The cookie is host-only, so this only answers on the host the member
     * signed in to Google on. Reaching it from the admin app means the admin host
     * runs its own OAuth round trip rather than borrowing the members' site's
     * session — see {@code docs/google-oauth-member-login.md}.
     */
    @PostMapping("/google")
    public AdminAuthResponse signInWithGoogle(HttpServletRequest request) {
        return adminGoogleSignInService.signIn(currentMemberService.requireCurrentMemberId(request));
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
