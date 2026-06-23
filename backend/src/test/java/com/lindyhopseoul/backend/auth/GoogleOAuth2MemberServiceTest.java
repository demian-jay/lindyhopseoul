package com.lindyhopseoul.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.lindyhopseoul.backend.member.Member;
import com.lindyhopseoul.backend.member.MemberPreferredLanguage;
import com.lindyhopseoul.backend.member.MemberProvider;
import com.lindyhopseoul.backend.member.MemberRepository;
import com.lindyhopseoul.backend.member.MemberRole;
import com.lindyhopseoul.backend.member.MemberStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;

@ExtendWith(MockitoExtension.class)
class GoogleOAuth2MemberServiceTest {

    private static final Instant LOGIN_AT = Instant.parse("2026-06-23T00:00:00Z");

    @Mock
    private MemberRepository memberRepository;

    private GoogleOAuth2MemberService memberService;

    @BeforeEach
    void setUp() {
        memberService = new GoogleOAuth2MemberService(
                memberRepository,
                Clock.fixed(LOGIN_AT, ZoneOffset.UTC)
        );
    }

    @Test
    void handleLoginCreatesDefaultMemberForFirstGoogleLogin() {
        when(memberRepository.findByProviderAndProviderId(MemberProvider.GOOGLE, "google-sub-1"))
                .thenReturn(Optional.empty());
        when(memberRepository.save(any(Member.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Member member = memberService.handleLogin(authentication(Map.of(
                "sub", "google-sub-1",
                "email", "USER@example.com",
                "name", "User Name",
                "picture", "https://example.com/profile.png"
        )));

        assertThat(member.getProvider()).isEqualTo(MemberProvider.GOOGLE);
        assertThat(member.getProviderId()).isEqualTo("google-sub-1");
        assertThat(member.getEmail()).isEqualTo("user@example.com");
        assertThat(member.getDisplayName()).isEqualTo("User Name");
        assertThat(member.getNickname()).isNull();
        assertThat(member.getPreferredLanguage()).isEqualTo(MemberPreferredLanguage.KO);
        assertThat(member.getRole()).isEqualTo(MemberRole.USER);
        assertThat(member.getStatus()).isEqualTo(MemberStatus.ACTIVE);
        assertThat(member.getLastLoginAt()).isEqualTo(LOGIN_AT);
        verify(memberRepository).save(any(Member.class));
    }

    @Test
    void handleLoginUpdatesExistingMemberWithoutCreatingDuplicate() {
        Member existingMember = Member.createGoogle(
                "google-sub-1",
                "old@example.com",
                "Old Name",
                Instant.parse("2026-06-01T00:00:00Z")
        );
        when(memberRepository.findByProviderAndProviderId(MemberProvider.GOOGLE, "google-sub-1"))
                .thenReturn(Optional.of(existingMember));

        Member member = memberService.handleLogin(authentication(Map.of(
                "sub", "google-sub-1",
                "email", "new@example.com",
                "name", "New Name"
        )));

        assertThat(member).isSameAs(existingMember);
        assertThat(member.getEmail()).isEqualTo("new@example.com");
        assertThat(member.getDisplayName()).isEqualTo("New Name");
        assertThat(member.getLastLoginAt()).isEqualTo(LOGIN_AT);
        verify(memberRepository, never()).save(any(Member.class));
    }

    @Test
    void handleLoginRejectsProfileWithoutGoogleSub() {
        assertThatThrownBy(() -> memberService.handleLogin(authentication(Map.of(
                "email", "user@example.com",
                "name", "User Name"
        )))).isInstanceOf(OAuth2AuthenticationException.class);
    }

    private OAuth2AuthenticationToken authentication(Map<String, Object> attributes) {
        String nameAttributeKey = attributes.containsKey("sub") ? "sub" : "email";
        DefaultOAuth2User principal = new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                nameAttributeKey
        );
        return new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");
    }
}
