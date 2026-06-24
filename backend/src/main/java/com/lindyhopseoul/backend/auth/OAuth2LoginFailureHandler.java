package com.lindyhopseoul.backend.auth;

import java.io.IOException;
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
        redirectStrategy.sendRedirect(request, response, failureRedirectUri(exception));
    }

    private String failureRedirectUri(AuthenticationException exception) {
        if (exception instanceof OAuth2AuthenticationException oauth2Exception
                && GoogleOAuth2MemberService.SUSPENDED_MEMBER_ERROR_CODE.equals(oauth2Exception.getError().getErrorCode())) {
            return appendQueryParam(redirectProperties.getFailureRedirectUri(), "reason", "account_restricted");
        }
        return redirectProperties.getFailureRedirectUri();
    }

    private String appendQueryParam(String uri, String name, String value) {
        String separator = uri.contains("?") ? "&" : "?";
        return uri + separator
                + URLEncoder.encode(name, StandardCharsets.UTF_8)
                + "="
                + URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
