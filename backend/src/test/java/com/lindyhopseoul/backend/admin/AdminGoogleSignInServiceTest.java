package com.lindyhopseoul.backend.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.lindyhopseoul.backend.exception.ForbiddenException;
import com.lindyhopseoul.backend.member.Member;
import com.lindyhopseoul.backend.member.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * The crossing from a member session to an admin one. Every refusal here is the
 * same refusal on purpose, so the tests assert the type rather than distinct
 * messages.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminGoogleSignInServiceTest {

    private static final Long MEMBER_ID = 42L;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private AdminSessionRepository adminSessionRepository;

    private PasswordHasher passwordHasher;
    private AdminGoogleSignInService service;

    @BeforeEach
    void setUp() {
        passwordHasher = new PasswordHasher();
        service = new AdminGoogleSignInService(
                memberRepository,
                userAccountRepository,
                new AdminSessionService(
                        adminSessionRepository,
                        userAccountRepository,
                        mock(PlatformTransactionManager.class)
                )
        );
    }

    @Test
    void issuesAnAdminSessionForALinkedMember() {
        Member member = activeMember();
        UserAccount account = adminAccount();
        account.linkMember(MEMBER_ID);
        when(memberRepository.findById(MEMBER_ID)).thenReturn(Optional.of(member));
        when(userAccountRepository.findByMemberId(MEMBER_ID)).thenReturn(Optional.of(account));

        AdminAuthResponse response = service.signIn(MEMBER_ID);

        assertThat(response.accessToken()).isNotBlank();
        assertThat(response.user().loginId()).isEqualTo("staff");
    }

    @Test
    void refusesAMemberThatNoAdminAccountIsLinkedTo() {
        when(memberRepository.findById(MEMBER_ID)).thenReturn(Optional.of(activeMember()));
        when(userAccountRepository.findByMemberId(MEMBER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.signIn(MEMBER_ID))
                .isInstanceOf(ForbiddenException.class);
    }

    /**
     * Withdrawal keeps the member row, so a link made beforehand still points at
     * it. The status check is what stops it being a way in.
     */
    @Test
    void refusesAWithdrawnMemberWhoseLinkSurvived() {
        Member member = activeMember();
        member.withdraw(Instant.parse("2026-08-01T00:00:00Z"));
        UserAccount account = adminAccount();
        account.linkMember(MEMBER_ID);
        when(memberRepository.findById(MEMBER_ID)).thenReturn(Optional.of(member));
        when(userAccountRepository.findByMemberId(MEMBER_ID)).thenReturn(Optional.of(account));

        assertThatThrownBy(() -> service.signIn(MEMBER_ID))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void refusesASuspendedMember() {
        Member member = activeMember();
        member.suspend();
        when(memberRepository.findById(MEMBER_ID)).thenReturn(Optional.of(member));

        assertThatThrownBy(() -> service.signIn(MEMBER_ID))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void refusesADeactivatedAdminAccount() {
        UserAccount account = adminAccount();
        account.linkMember(MEMBER_ID);
        account.deactivate();
        when(memberRepository.findById(MEMBER_ID)).thenReturn(Optional.of(activeMember()));
        when(userAccountRepository.findByMemberId(MEMBER_ID)).thenReturn(Optional.of(account));

        assertThatThrownBy(() -> service.signIn(MEMBER_ID))
                .isInstanceOf(ForbiddenException.class);
    }

    /**
     * Signing in through Google does not settle a password the holder never chose.
     * The session comes out flagged, and the interceptor still holds them at the
     * password screen.
     */
    @Test
    void carriesThePendingPasswordChangeIntoTheSession() {
        UserAccount account = adminAccount();
        account.linkMember(MEMBER_ID);
        when(memberRepository.findById(MEMBER_ID)).thenReturn(Optional.of(activeMember()));
        when(userAccountRepository.findByMemberId(MEMBER_ID)).thenReturn(Optional.of(account));

        assertThat(service.signIn(MEMBER_ID).user().mustChangePassword()).isTrue();

        account.changePassword(passwordHasher.hash("chosenbythem"));

        assertThat(service.signIn(MEMBER_ID).user().mustChangePassword()).isFalse();
    }

    private Member activeMember() {
        Member member = Member.createGoogle(
                "google-sub-1",
                "staff@example.com",
                "Staff Person",
                Instant.parse("2026-06-01T00:00:00Z")
        );
        ReflectionTestUtils.setField(member, "id", MEMBER_ID);
        return member;
    }

    private UserAccount adminAccount() {
        return UserAccount.create(
                "A1",
                "Staff Person",
                "staff",
                null,
                passwordHasher.hash("handedout"),
                AdminLanguage.Kor,
                List.of(AdminRole.STAFF)
        );
    }
}
