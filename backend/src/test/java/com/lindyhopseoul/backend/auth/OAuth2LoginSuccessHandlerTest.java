package com.lindyhopseoul.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;

import com.lindyhopseoul.backend.member.Member;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

class OAuth2LoginSuccessHandlerTest {

    private final GoogleOAuth2MemberService memberService = mock(GoogleOAuth2MemberService.class);

    private OAuth2LoginSuccessHandler handler() {
        OAuth2RedirectProperties props = new OAuth2RedirectProperties();
        props.setSuccessRedirectUri("https://lindyhopseoul.com/oauth/success");
        props.setAllowedRedirectHosts("lindyhopseoul.com,swingpopseoul.com");
        return new OAuth2LoginSuccessHandler(memberService, props);
    }

    private MockHttpServletRequest requestFrom(String host) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setScheme("https");
        request.setServerName(host);
        request.setServerPort(443);
        request.setRequestURI("/login/oauth2/code/google");
        return request;
    }

    private Member member(long id, boolean newRegistration) {
        Member member = Member.createGoogle("sub-" + id, "user@example.com", "User", Instant.now());
        if (!newRegistration) {
            member.recordLogin("user@example.com", "User", Instant.now());
        }
        ReflectionTestUtils.setField(member, "id", id);
        return member;
    }

    @Test
    void newSignupRedirectsToLoginDomainWithWelcome() throws Exception {
        when(memberService.handleLogin(any())).thenReturn(member(5L, true));
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler().onAuthenticationSuccess(requestFrom("swingpopseoul.com"), response, mock(Authentication.class));

        assertThat(response.getRedirectedUrl()).isEqualTo("https://swingpopseoul.com/oauth/success?welcome=1");
    }

    @Test
    void existingLoginRedirectsWithoutWelcome() throws Exception {
        when(memberService.handleLogin(any())).thenReturn(member(6L, false));
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler().onAuthenticationSuccess(requestFrom("swingpopseoul.com"), response, mock(Authentication.class));

        assertThat(response.getRedirectedUrl()).isEqualTo("https://swingpopseoul.com/oauth/success");
    }
}
