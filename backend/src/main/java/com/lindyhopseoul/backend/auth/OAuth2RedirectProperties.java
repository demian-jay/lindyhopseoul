package com.lindyhopseoul.backend.auth;

import java.util.LinkedHashSet;
import java.util.Set;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.oauth2")
public class OAuth2RedirectProperties {

    private String successRedirectUri = "http://localhost:5173/oauth/success";
    private String failureRedirectUri = "http://localhost:5173/oauth/error";
    // Comma-separated hosts (e.g. "lindyhopseoul.com,swingpopseoul.com") that a login
    // may be returned to. When the login arrives on one of these hosts, the success /
    // failure redirect is rebuilt on that host so a login started on one domain returns
    // to the same domain (whose session cookie was set), instead of a fixed one. Empty
    // (e.g. local dev, where frontend and backend are different origins) keeps the
    // configured absolute URI.
    private String allowedRedirectHosts = "";

    public String getSuccessRedirectUri() {
        return successRedirectUri;
    }

    public void setSuccessRedirectUri(String successRedirectUri) {
        this.successRedirectUri = successRedirectUri;
    }

    public String getFailureRedirectUri() {
        return failureRedirectUri;
    }

    public void setFailureRedirectUri(String failureRedirectUri) {
        this.failureRedirectUri = failureRedirectUri;
    }

    public String getAllowedRedirectHosts() {
        return allowedRedirectHosts;
    }

    public void setAllowedRedirectHosts(String allowedRedirectHosts) {
        this.allowedRedirectHosts = allowedRedirectHosts;
    }

    public Set<String> allowedRedirectHostSet() {
        Set<String> hosts = new LinkedHashSet<>();
        if (allowedRedirectHosts != null) {
            for (String host : allowedRedirectHosts.split(",")) {
                String trimmed = host.trim();
                if (!trimmed.isEmpty()) {
                    hosts.add(trimmed);
                }
            }
        }
        return hosts;
    }
}
