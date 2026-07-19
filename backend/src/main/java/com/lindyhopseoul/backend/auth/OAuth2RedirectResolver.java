package com.lindyhopseoul.backend.auth;

import java.net.URI;
import java.util.Set;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.util.UriComponentsBuilder;

final class OAuth2RedirectResolver {

    private OAuth2RedirectResolver() {
    }

    // If the login arrived on one of the trusted app hosts, rebuild the configured
    // redirect's path on that host so the user returns to the domain they logged in
    // from (whose session cookie was just set). Otherwise fall back to the configured
    // absolute URI. The scheme/host come from the (nginx-set, framework-parsed)
    // forwarded request; the allow-list prevents redirecting to an untrusted host.
    static String onCurrentOrigin(HttpServletRequest request, String configuredUri, Set<String> allowedHosts) {
        String host = request.getServerName();
        if (host == null || !allowedHosts.contains(host)) {
            return configuredUri;
        }
        URI configured = URI.create(configuredUri);
        UriComponentsBuilder builder = UriComponentsBuilder.newInstance()
                .scheme(request.getScheme())
                .host(host)
                .path(configured.getRawPath());
        if (configured.getRawQuery() != null) {
            builder.query(configured.getRawQuery());
        }
        return builder.build().toUriString();
    }
}
