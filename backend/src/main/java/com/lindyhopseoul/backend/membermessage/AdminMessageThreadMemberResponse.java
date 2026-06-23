package com.lindyhopseoul.backend.membermessage;

import com.lindyhopseoul.backend.member.Member;
import com.lindyhopseoul.backend.member.MemberStatus;

public record AdminMessageThreadMemberResponse(
        Long memberId,
        String email,
        String displayName,
        String nickname,
        MemberStatus status
) {

    public static AdminMessageThreadMemberResponse from(Member member) {
        return new AdminMessageThreadMemberResponse(
                member.getId(),
                member.getEmail(),
                member.getDisplayName(),
                member.getNickname(),
                member.getStatus()
        );
    }
}
