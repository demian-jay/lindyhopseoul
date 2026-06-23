package com.lindyhopseoul.backend.auth;

import java.io.IOException;

import com.lindyhopseoul.backend.member.Member;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.DefaultRedirectStrategy;
import org.springframework.security.web.RedirectStrategy;
import org.springframework.stereotype.Component;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final GoogleOAuth2MemberService memberService;
    private final OAuth2RedirectProperties redirectProperties;
    private final RedirectStrategy redirectStrategy = new DefaultRedirectStrategy();

    public OAuth2LoginSuccessHandler(
            GoogleOAuth2MemberService memberService,
            OAuth2RedirectProperties redirectProperties
    ) {
        this.memberService = memberService;
        this.redirectProperties = redirectProperties;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        Member member = memberService.handleLogin(authentication);
        request.getSession(true)
                .setAttribute(AuthSessionConstants.MEMBER_ID_ATTRIBUTE, member.getId());
        redirectStrategy.sendRedirect(request, response, redirectProperties.getSuccessRedirectUri());
    }
}
