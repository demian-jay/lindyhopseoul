package com.lindyhopseoul.backend.auth;

import java.io.IOException;

import com.lindyhopseoul.backend.member.Member;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.DefaultRedirectStrategy;
import org.springframework.security.web.RedirectStrategy;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

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
        HttpSession session = request.getSession(true);
        session.setAttribute(AuthSessionConstants.MEMBER_ID_ATTRIBUTE, member.getId());
        dropOAuthPrincipal(session);
        String redirectUri = OAuth2RedirectResolver.onCurrentOrigin(
                request,
                redirectProperties.getSuccessRedirectUri(),
                redirectProperties.allowedRedirectHostSet()
        );
        if (member.isNewlyRegistered()) {
            redirectUri = UriComponentsBuilder.fromUriString(redirectUri)
                    .queryParam("welcome", "1")
                    .build()
                    .toUriString();
        }
        redirectStrategy.sendRedirect(request, response, redirectUri);
    }

    /**
     * Spring Security saved the OIDC principal — Google's ID token, its claims and
     * the profile image URL among them — into the session just before this handler
     * ran. Nothing here reads it: authentication is the member id set above, and
     * every route is {@code permitAll}. Now that sessions are written to the
     * database it would be Google identity data at rest, which
     * `docs/google-oauth-member-login.md` says this project does not keep, so drop
     * it and leave the session holding the member id alone.
     */
    private void dropOAuthPrincipal(HttpSession session) {
        session.removeAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY);
        SecurityContextHolder.clearContext();
    }
}
