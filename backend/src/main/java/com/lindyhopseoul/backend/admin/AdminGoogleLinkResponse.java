package com.lindyhopseoul.backend.admin;

import java.util.List;

import com.lindyhopseoul.backend.member.Member;
import com.lindyhopseoul.backend.member.MemberStatus;

/**
 * One admin account on the linking screen, with the member it signs in as when
 * there is one.
 *
 * <p>The member half is flattened in rather than referenced by id so the screen
 * can name who an account is paired with without fetching the member list first.
 * It carries no more than a name and a status: this screen decides who may sign
 * in, and the rest of a member's record is not part of that.
 */
public record AdminGoogleLinkResponse(
        String userId,
        String loginId,
        String name,
        List<AdminRole> roles,
        boolean mustChangePassword,
        Long memberId,
        String memberDisplayName,
        String memberNickname,
        String memberEmail,
        MemberStatus memberStatus
) {

    public static AdminGoogleLinkResponse of(UserAccount account, Member member) {
        return new AdminGoogleLinkResponse(
                account.getUserId(),
                account.getLoginId(),
                account.getName(),
                account.getRoleCodes(),
                account.mustChangePassword(),
                member == null ? null : member.getId(),
                member == null ? null : member.getDisplayName(),
                member == null ? null : member.getNickname(),
                member == null ? null : member.getEmail(),
                member == null ? null : member.getStatus()
        );
    }

    public static AdminGoogleLinkResponse unlinked(UserAccount account) {
        return of(account, null);
    }
}
