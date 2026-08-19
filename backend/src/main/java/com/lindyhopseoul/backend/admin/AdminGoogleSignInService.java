package com.lindyhopseoul.backend.admin;

import com.lindyhopseoul.backend.exception.ForbiddenException;
import com.lindyhopseoul.backend.member.Member;
import com.lindyhopseoul.backend.member.MemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Turns a signed-in member into a signed-in admin, for staff who reach the admin
 * app with the Google account they already registered with as a member.
 *
 * <p>This is a bridge, not a merge. The two sessions stay what they are: members
 * hold a cookie session carrying a member id, admins hold a bearer token in
 * {@code admin_session} carrying an account id. What this adds is one crossing,
 * taken only where a super admin has paired the two rows by hand.
 *
 * <p>The pairing is never inferred from a matching email. A Google address can be
 * given up and handed to someone else, and an admin account is worth more than
 * the string it shares with a member row.
 */
@Service
public class AdminGoogleSignInService {

    private final MemberRepository memberRepository;
    private final UserAccountRepository userAccountRepository;
    private final AdminSessionService adminSessionService;

    public AdminGoogleSignInService(
            MemberRepository memberRepository,
            UserAccountRepository userAccountRepository,
            AdminSessionService adminSessionService
    ) {
        this.memberRepository = memberRepository;
        this.userAccountRepository = userAccountRepository;
        this.adminSessionService = adminSessionService;
    }

    /**
     * Issues an admin session for the member already signed in on this request.
     *
     * <p>Every refusal answers the same way. Whether an admin account exists, and
     * which member it belongs to, is not something a caller holding some other
     * member's session should be able to probe.
     *
     * <p>Note what is deliberately not checked here: {@code mustChangePassword}.
     * Signing in this way does not settle a password the holder never chose, so
     * the session comes out flagged exactly as a password sign-in would and
     * {@link AdminApiAuthInterceptor} still holds them at the password screen.
     * Arriving by Google is a second door into the account, not a way past the
     * controls on it.
     */
    @Transactional
    public AdminAuthResponse signIn(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .filter(Member::isActive)
                .orElseThrow(AdminGoogleSignInService::notLinked);

        UserAccount account = userAccountRepository.findByMemberId(member.getId())
                .filter(UserAccount::isActive)
                .orElseThrow(AdminGoogleSignInService::notLinked);

        return adminSessionService.createSession(AdminPrincipal.from(account));
    }

    /**
     * A withdrawn member keeps its row, so a link made before withdrawal still
     * points at it. The status check above is what closes that, rather than
     * clearing links from the member side: withdrawal masks identifiers and
     * preserves history, and a re-registration is a new row with a new id, so it
     * cannot inherit the old pairing either.
     */
    private static ForbiddenException notLinked() {
        return new ForbiddenException("This Google account is not linked to an admin account.");
    }
}
