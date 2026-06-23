package com.lindyhopseoul.backend.auth;

import java.time.Clock;
import java.time.Instant;

import com.lindyhopseoul.backend.member.Member;
import com.lindyhopseoul.backend.member.MemberProvider;
import com.lindyhopseoul.backend.member.MemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GoogleOAuth2MemberService {

    private static final OAuth2Error INVALID_GOOGLE_USER =
            new OAuth2Error("invalid_google_user");

    private final MemberRepository memberRepository;
    private final Clock clock;

    @Autowired
    public GoogleOAuth2MemberService(MemberRepository memberRepository) {
        this(memberRepository, Clock.systemUTC());
    }

    GoogleOAuth2MemberService(MemberRepository memberRepository, Clock clock) {
        this.memberRepository = memberRepository;
        this.clock = clock;
    }

    @Transactional
    public Member handleLogin(Authentication authentication) {
        GoogleProfile profile = extractProfile(authentication);
        Instant loginAt = Instant.now(clock);

        return memberRepository.findByProviderAndProviderId(MemberProvider.GOOGLE, profile.sub())
                .map(member -> {
                    member.recordLogin(profile.email(), profile.displayName(), loginAt);
                    return member;
                })
                .orElseGet(() -> memberRepository.save(Member.createGoogle(
                        profile.sub(),
                        profile.email(),
                        profile.displayName(),
                        loginAt
                )));
    }

    private GoogleProfile extractProfile(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof OAuth2User oauth2User)) {
            throw invalidGoogleUser();
        }

        String sub = attribute(oauth2User, "sub");
        String email = attribute(oauth2User, "email");
        String displayName = attribute(oauth2User, "name");

        if (oauth2User instanceof OidcUser oidcUser) {
            sub = firstNonBlank(oidcUser.getSubject(), sub);
            email = firstNonBlank(oidcUser.getEmail(), email);
            displayName = firstNonBlank(oidcUser.getFullName(), displayName);
        }

        if (displayName == null || displayName.isBlank()) {
            displayName = firstNonBlank(attribute(oauth2User, "given_name"), email);
        }

        if (sub == null || sub.isBlank() || email == null || email.isBlank()) {
            throw invalidGoogleUser();
        }

        return new GoogleProfile(sub.trim(), email.trim(), displayName == null ? "" : displayName.trim());
    }

    private String attribute(OAuth2User oauth2User, String name) {
        Object value = oauth2User.getAttributes().get(name);
        return value == null ? null : String.valueOf(value);
    }

    private String firstNonBlank(String preferred, String fallback) {
        return preferred == null || preferred.isBlank() ? fallback : preferred;
    }

    private OAuth2AuthenticationException invalidGoogleUser() {
        return new OAuth2AuthenticationException(
                INVALID_GOOGLE_USER,
                "Google account information is incomplete."
        );
    }

    private record GoogleProfile(String sub, String email, String displayName) {
    }
}
