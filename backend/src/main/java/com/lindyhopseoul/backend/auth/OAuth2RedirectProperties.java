package com.lindyhopseoul.backend.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.oauth2")
public class OAuth2RedirectProperties {

    private String successRedirectUri = "http://localhost:5173/oauth/success";
    private String failureRedirectUri = "http://localhost:5173/oauth/error";

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
}
