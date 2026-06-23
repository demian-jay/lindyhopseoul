package com.lindyhopseoul.backend.membermessage;

import com.lindyhopseoul.backend.member.Member;

public record AdminMessageThreadMemberResponse(
        Long memberId,
        String email,
        String displayName,
        String nickname
) {

    public static AdminMessageThreadMemberResponse from(Member member) {
        return new AdminMessageThreadMemberResponse(
                member.getId(),
                member.getEmail(),
                member.getDisplayName(),
                member.getNickname()
        );
    }
}
