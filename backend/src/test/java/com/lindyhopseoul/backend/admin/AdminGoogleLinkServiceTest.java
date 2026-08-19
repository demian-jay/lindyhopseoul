package com.lindyhopseoul.backend.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.lindyhopseoul.backend.exception.ConflictException;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import com.lindyhopseoul.backend.exception.ResourceNotFoundException;
import com.lindyhopseoul.backend.member.Member;
import com.lindyhopseoul.backend.member.MemberRepository;
import com.lindyhopseoul.backend.member.MemberStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminGoogleLinkServiceTest {

    private static final AdminPrincipal SUPER_ADMIN = principal(AdminRole.SUPER_ADMIN);
    private static final AdminPrincipal STAFF = principal(AdminRole.STAFF);

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private MemberRepository memberRepository;

    private PasswordHasher passwordHasher;
    private AdminGoogleLinkService service;

    @BeforeEach
    void setUp() {
        passwordHasher = new PasswordHasher();
        service = new AdminGoogleLinkService(userAccountRepository, memberRepository);
    }

    @Test
    void linksAnAccountToAnActiveMember() {
        UserAccount account = adminAccount("A1", "staff");
        when(userAccountRepository.findById("A1")).thenReturn(Optional.of(account));
        when(memberRepository.findById(42L)).thenReturn(Optional.of(member(42L)));
        when(userAccountRepository.findByMemberId(42L)).thenReturn(Optional.empty());

        AdminGoogleLinkResponse response = service.link(SUPER_ADMIN, "A1", 42L);

        assertThat(account.getMemberId()).isEqualTo(42L);
        assertThat(response.memberId()).isEqualTo(42L);
        assertThat(response.memberStatus()).isEqualTo(MemberStatus.ACTIVE);
    }

    /**
     * A link is a way into an admin account, so handing one out is super-admin
     * work — the same bar as creating the account was.
     */
    @Test
    void refusesEveryOperationToANonSuperAdmin() {
        assertThatThrownBy(() -> service.findLinks(STAFF)).isInstanceOf(ForbiddenException.class);
        assertThatThrownBy(() -> service.link(STAFF, "A1", 42L)).isInstanceOf(ForbiddenException.class);
        assertThatThrownBy(() -> service.unlink(STAFF, "A1")).isInstanceOf(ForbiddenException.class);
    }

    @Test
    void refusesAMemberAlreadyLinkedToAnotherAccount() {
        UserAccount taken = adminAccount("A2", "other");
        taken.linkMember(42L);
        when(userAccountRepository.findById("A1")).thenReturn(Optional.of(adminAccount("A1", "staff")));
        when(memberRepository.findById(42L)).thenReturn(Optional.of(member(42L)));
        when(userAccountRepository.findByMemberId(42L)).thenReturn(Optional.of(taken));

        assertThatThrownBy(() -> service.link(SUPER_ADMIN, "A1", 42L))
                .isInstanceOf(ConflictException.class);
    }

    /**
     * Re-linking the account that already holds the member is the screen's edit
     * action, not a clash with itself.
     */
    @Test
    void allowsRelinkingTheAccountThatAlreadyHoldsTheMember() {
        UserAccount account = adminAccount("A1", "staff");
        account.linkMember(42L);
        when(userAccountRepository.findById("A1")).thenReturn(Optional.of(account));
        when(memberRepository.findById(42L)).thenReturn(Optional.of(member(42L)));
        when(userAccountRepository.findByMemberId(42L)).thenReturn(Optional.of(account));

        assertThat(service.link(SUPER_ADMIN, "A1", 42L).memberId()).isEqualTo(42L);
    }

    @Test
    void refusesAWithdrawnMember() {
        Member withdrawn = member(42L);
        withdrawn.withdraw(Instant.parse("2026-08-01T00:00:00Z"));
        when(userAccountRepository.findById("A1")).thenReturn(Optional.of(adminAccount("A1", "staff")));
        when(memberRepository.findById(42L)).thenReturn(Optional.of(withdrawn));

        assertThatThrownBy(() -> service.link(SUPER_ADMIN, "A1", 42L))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void reportsAnUnknownAccountOrMember() {
        when(userAccountRepository.findById("nope")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.link(SUPER_ADMIN, "nope", 42L))
                .isInstanceOf(ResourceNotFoundException.class);

        when(userAccountRepository.findById("A1")).thenReturn(Optional.of(adminAccount("A1", "staff")));
        when(memberRepository.findById(999L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.link(SUPER_ADMIN, "A1", 999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void unlinkClearsTheMemberButKeepsTheAccount() {
        UserAccount account = adminAccount("A1", "staff");
        account.linkMember(42L);
        when(userAccountRepository.findById("A1")).thenReturn(Optional.of(account));

        AdminGoogleLinkResponse response = service.unlink(SUPER_ADMIN, "A1");

        assertThat(account.getMemberId()).isNull();
        assertThat(account.isActive()).isTrue();
        assertThat(response.memberId()).isNull();
        assertThat(response.loginId()).isEqualTo("staff");
    }

    /**
     * A deactivated account cannot be signed in to by either door, so offering to
     * link one would suggest it could.
     */
    @Test
    void listsOnlyActiveAccountsAndResolvesTheirMembers() {
        UserAccount linked = adminAccount("A1", "staff");
        linked.linkMember(42L);
        UserAccount unlinked = adminAccount("A2", "other");
        UserAccount inactive = adminAccount("A3", "gone");
        inactive.deactivate();
        when(userAccountRepository.findAll()).thenReturn(List.of(linked, unlinked, inactive));
        when(memberRepository.findAllById(any())).thenReturn(List.of(member(42L)));

        List<AdminGoogleLinkResponse> links = service.findLinks(SUPER_ADMIN);

        assertThat(links).hasSize(2);
        assertThat(links).extracting(AdminGoogleLinkResponse::loginId).containsExactlyInAnyOrder("staff", "other");
        assertThat(links).filteredOn(link -> link.loginId().equals("staff"))
                .singleElement()
                .satisfies(link -> {
                    assertThat(link.memberId()).isEqualTo(42L);
                    assertThat(link.memberDisplayName()).isEqualTo("Staff Person");
                });
        assertThat(links).filteredOn(link -> link.loginId().equals("other"))
                .singleElement()
                .satisfies(link -> assertThat(link.memberId()).isNull());
    }

    private Member member(Long id) {
        Member member = Member.createGoogle(
                "google-sub-" + id,
                "staff@example.com",
                "Staff Person",
                Instant.parse("2026-06-01T00:00:00Z")
        );
        ReflectionTestUtils.setField(member, "id", id);
        return member;
    }

    private UserAccount adminAccount(String userId, String loginId) {
        return UserAccount.create(
                userId,
                "Staff Person",
                loginId,
                null,
                passwordHasher.hash("handedout"),
                AdminLanguage.Kor,
                List.of(AdminRole.STAFF)
        );
    }

    private static AdminPrincipal principal(AdminRole role) {
        return new AdminPrincipal("ACTOR", "Actor", "actor", role, List.of(role), AdminLanguage.Kor);
    }
}
