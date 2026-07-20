package com.lindyhopseoul.backend.admin;

import java.util.Set;

import com.lindyhopseoul.backend.exception.ForbiddenException;
import com.lindyhopseoul.backend.exception.UnauthorizedException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Blocks an admin who has never set their own password from doing anything
 * except reading who they are and fixing that.
 *
 * <p>This lives here rather than in the UI on purpose. The modal that prompts
 * for a new password can be dismissed with developer tools, and the API is
 * reachable directly with the session token, so a front-end-only prompt would
 * be a suggestion rather than a control. Putting it in an interceptor also
 * means a controller added later is covered without anyone remembering to.
 */
@Component
public class AdminPasswordChangeInterceptor implements HandlerInterceptor {

    /**
     * The only paths reachable while a change is pending: end the session, find
     * out who you are (so the UI can render the prompt), and set the password.
     */
    private static final Set<String> ALLOWED_PATHS = Set.of(
            "/api/admin/auth/login",
            "/api/admin/auth/logout",
            "/api/admin/auth/me",
            "/api/admin/auth/me/password"
    );

    private final AdminSessionService adminSessionService;

    public AdminPasswordChangeInterceptor(AdminSessionService adminSessionService) {
        this.adminSessionService = adminSessionService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }
        if (ALLOWED_PATHS.contains(request.getRequestURI())) {
            return true;
        }

        AdminPrincipal principal;
        try {
            principal = adminSessionService.requirePrincipal(request.getHeader(HttpHeaders.AUTHORIZATION));
        } catch (UnauthorizedException exception) {
            // Not signed in, or a dead token. Let the controller answer that in its
            // own words instead of reporting it as a password problem.
            return true;
        }

        if (principal.mustChangePassword()) {
            throw new ForbiddenException("PASSWORD_CHANGE_REQUIRED");
        }
        return true;
    }
}
