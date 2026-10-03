package com.lindyhopseoul.backend.auth;

import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import com.lindyhopseoul.backend.diagnostics.SafeDiagnostics;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.DefaultRedirectStrategy;
import org.springframework.security.web.RedirectStrategy;
import org.springframework.stereotype.Component;

@Component
public class OAuth2LoginFailureHandler implements AuthenticationFailureHandler {
    private static final Logger log = LoggerFactory.getLogger(OAuth2LoginFailureHandler.class);

    private final OAuth2RedirectProperties redirectProperties;
    private final RedirectStrategy redirectStrategy = new DefaultRedirectStrategy();

    public OAuth2LoginFailureHandler(OAuth2RedirectProperties redirectProperties) {
        this.redirectProperties = redirectProperties;
    }

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException, ServletException {
        String code = exception instanceof OAuth2AuthenticationException oauth ? oauth.getError().getErrorCode() : "authentication_failed";
        log.warn("OAUTH_FAILED requestId={} code={} exception={}", MDC.get("requestId"),
                code != null && code.matches("[a-z_]{1,80}") ? code : "unknown", SafeDiagnostics.exception(exception));
        redirectStrategy.sendRedirect(request, response, failureRedirectUri(request, exception));
    }

    private String failureRedirectUri(HttpServletRequest request, AuthenticationException exception) {
        String base = OAuth2RedirectResolver.onCurrentOrigin(
                request,
                redirectProperties.getFailureRedirectUri(),
                redirectProperties.allowedRedirectHostSet()
        );
        if (exception instanceof OAuth2AuthenticationException oauth2Exception
                && GoogleOAuth2MemberService.SUSPENDED_MEMBER_ERROR_CODE.equals(oauth2Exception.getError().getErrorCode())) {
            return appendQueryParam(base, "reason", "account_restricted");
        }
        return base;
    }

    private String appendQueryParam(String uri, String name, String value) {
        String separator = uri.contains("?") ? "&" : "?";
        return uri + separator
                + URLEncoder.encode(name, StandardCharsets.UTF_8)
                + "="
                + URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
