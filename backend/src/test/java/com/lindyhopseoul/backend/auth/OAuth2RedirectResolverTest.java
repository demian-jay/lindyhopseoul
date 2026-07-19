package com.lindyhopseoul.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class OAuth2RedirectResolverTest {

    private MockHttpServletRequest request(String scheme, String host, String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setScheme(scheme);
        request.setServerName(host);
        request.setServerPort("https".equals(scheme) ? 443 : 80);
        request.setRequestURI(uri);
        return request;
    }

    @Test
    void rebuildsRedirectOnTrustedLoginHost() {
        String result = OAuth2RedirectResolver.onCurrentOrigin(
                request("https", "swingpopseoul.com", "/login/oauth2/code/google"),
                "https://lindyhopseoul.com/oauth/success",
                Set.of("lindyhopseoul.com", "swingpopseoul.com"));

        assertThat(result).isEqualTo("https://swingpopseoul.com/oauth/success");
    }

    @Test
    void keepsConfiguredRedirectForUntrustedHost() {
        String result = OAuth2RedirectResolver.onCurrentOrigin(
                request("https", "evil.example.com", "/login/oauth2/code/google"),
                "https://lindyhopseoul.com/oauth/success",
                Set.of("lindyhopseoul.com", "swingpopseoul.com"));

        assertThat(result).isEqualTo("https://lindyhopseoul.com/oauth/success");
    }

    @Test
    void keepsConfiguredRedirectWhenNoAllowedHosts() {
        // Local dev: frontend (5173) and backend (18080) are different origins, so the
        // allow-list is empty and the configured absolute URI is used as-is.
        String result = OAuth2RedirectResolver.onCurrentOrigin(
                request("http", "localhost", "/login/oauth2/code/google"),
                "http://localhost:5173/oauth/success",
                Set.of());

        assertThat(result).isEqualTo("http://localhost:5173/oauth/success");
    }
}
