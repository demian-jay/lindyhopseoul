package com.lindyhopseoul.backend.admin;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.lindyhopseoul.backend.exception.ConflictException;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import com.lindyhopseoul.backend.exception.ResourceNotFoundException;
import com.lindyhopseoul.backend.member.Member;
import com.lindyhopseoul.backend.member.MemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Pairing admin accounts with the member accounts their holders sign in to
 * Google with. Reading and writing are both super-admin only: a link is a way
 * into an admin account, so handing one out is the same kind of act as creating
 * the account was.
 */
@Service
@Transactional(readOnly = true)
public class AdminGoogleLinkService {

    private final UserAccountRepository userAccountRepository;
    private final MemberRepository memberRepository;

    public AdminGoogleLinkService(
            UserAccountRepository userAccountRepository,
            MemberRepository memberRepository
    ) {
        this.userAccountRepository = userAccountRepository;
        this.memberRepository = memberRepository;
    }

    /**
     * Every account the screen can pair, each with its current member.
     *
     * <p>Deactivated accounts are left out: they cannot be signed in to by either
     * door, so offering to link one would suggest it could.
     */
    public List<AdminGoogleLinkResponse> findLinks(AdminPrincipal actor) {
        requireSuperAdmin(actor);

        List<UserAccount> accounts = userAccountRepository.findAll().stream()
                .filter(UserAccount::isActive)
                .sorted(Comparator.comparing(UserAccount::getName, Comparator.nullsLast(String::compareTo)))
                .toList();

        // One query for the members rather than one per account.
        Set<Long> memberIds = accounts.stream()
                .map(UserAccount::getMemberId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        Map<Long, Member> members = memberIds.isEmpty()
                ? Map.of()
                : memberRepository.findAllById(memberIds).stream()
                        .collect(Collectors.toMap(Member::getId, Function.identity()));

        return accounts.stream()
                .map(account -> AdminGoogleLinkResponse.of(
                        account,
                        account.getMemberId() == null ? null : members.get(account.getMemberId())))
                .toList();
    }

    /**
     * Pairs one admin account with one member.
     *
     * <p>A member may back at most one admin account, so a member already spoken
     * for is refused rather than quietly moved. Re-linking an account that already
     * has a member does replace it — that is the screen's edit action, and the
     * account keeps its identity either way.
     */
    @Transactional
    public AdminGoogleLinkResponse link(AdminPrincipal actor, String userId, Long memberId) {
        requireSuperAdmin(actor);

        UserAccount account = requireAccount(userId);
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + memberId));

        // A withdrawn or suspended member cannot sign in, so a link to one would be
        // a row that never works. Refused here rather than at sign-in so the screen
        // says so while someone is looking at it.
        if (!member.isActive()) {
            throw new ConflictException("Only an active member can be linked.");
        }

        userAccountRepository.findByMemberId(memberId)
                .filter(existing -> !existing.getUserId().equals(account.getUserId()))
                .ifPresent(existing -> {
                    throw new ConflictException("This member is already linked to another admin account.");
                });

        account.linkMember(memberId);
        return AdminGoogleLinkResponse.of(account, member);
    }

    /**
     * Removes the pairing. The admin account and the member both stay; only the
     * Google door closes, and the account's password sign-in is untouched.
     */
    @Transactional
    public AdminGoogleLinkResponse unlink(AdminPrincipal actor, String userId) {
        requireSuperAdmin(actor);

        UserAccount account = requireAccount(userId);
        account.unlinkMember();
        return AdminGoogleLinkResponse.unlinked(account);
    }

    private UserAccount requireAccount(String userId) {
        return userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    private void requireSuperAdmin(AdminPrincipal actor) {
        if (!actor.hasRole(AdminRole.SUPER_ADMIN)) {
            throw new ForbiddenException("Only a super administrator can manage Google account links.");
        }
    }
}
