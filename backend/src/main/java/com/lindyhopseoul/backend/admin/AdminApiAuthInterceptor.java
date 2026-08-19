package com.lindyhopseoul.backend.admin;

import java.util.Set;

import com.lindyhopseoul.backend.exception.ForbiddenException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Requires a signed-in admin for every route it covers, and blocks an admin who
 * has never set their own password from doing anything except reading who they
 * are and fixing that.
 *
 * <p>Authentication lives here rather than only in the controllers so that a
 * route added later is closed by default. It used to be per-method: each handler
 * called {@link AdminSessionService#requirePrincipal} itself, and this
 * interceptor deliberately let an unauthenticated caller through so the
 * controller could answer in its own words. That made forgetting the call a
 * silent hole — it compiles, it passes, and the route is public. Handlers still
 * make the call to get the principal they act on, which costs nothing because
 * the answer is cached for the request, but it is no longer what stands between
 * a stranger and the data.
 *
 * <p>The password block lives here for the same reason and one more: the modal
 * that prompts for a new password can be dismissed with developer tools, and the
 * API is reachable directly with the session token, so a front-end-only prompt
 * would be a suggestion rather than a control.
 *
 * <p>Both lists below are allowlists, so a path that does not match exactly —
 * a trailing slash, a different case — is authenticated rather than skipped.
 * Failing closed is the point.
 */
@Component
public class AdminApiAuthInterceptor implements HandlerInterceptor {

    /**
     * Reachable without an admin session, because they are how one is obtained or
     * given up. Sign-out stays open on purpose: a token that has already expired
     * should still let the client finish signing out rather than fail, and the
     * request can only ever delete the session matching the token it presents.
     *
     * <p>{@code /google} is here for the same reason as {@code /login} — it is a
     * way in, so it cannot require the thing it hands out. It is not open: it
     * demands a live member session cookie instead.
     */
    private static final Set<String> ANONYMOUS_PATHS = Set.of(
            "/api/admin/auth/login",
            "/api/admin/auth/logout",
            "/api/admin/auth/google"
    );

    /**
     * Reachable while a password change is pending: find out who you are, so the
     * UI can render the prompt, and set the password. These are authenticated like
     * everything else; they are only exempt from the block.
     */
    private static final Set<String> PASSWORD_CHANGE_PATHS = Set.of(
            "/api/admin/auth/me",
            "/api/admin/auth/me/password"
    );

    private final AdminSessionService adminSessionService;

    public AdminApiAuthInterceptor(AdminSessionService adminSessionService) {
        this.adminSessionService = adminSessionService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI();
        if (ANONYMOUS_PATHS.contains(path)) {
            return true;
        }

        // Throws UnauthorizedException, which the global handler renders as 401,
        // when the token is missing, malformed, unknown, expired, or belongs to an
        // account that has since been deactivated.
        AdminPrincipal principal = adminSessionService.requirePrincipal(
                request.getHeader(HttpHeaders.AUTHORIZATION));

        if (principal.mustChangePassword() && !PASSWORD_CHANGE_PATHS.contains(path)) {
            throw new ForbiddenException("PASSWORD_CHANGE_REQUIRED");
        }

        return true;
    }
}
