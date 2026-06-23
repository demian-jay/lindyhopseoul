package com.lindyhopseoul.backend.auth;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.lindyhopseoul.backend.member.Member;
import com.lindyhopseoul.backend.member.MemberRole;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthMeResponse(
        boolean authenticated,
        Long memberId,
        String email,
        String displayName,
        MemberRole role
) {

    public static AuthMeResponse unauthenticated() {
        return new AuthMeResponse(false, null, null, null, null);
    }

    public static AuthMeResponse authenticated(Member member) {
        return new AuthMeResponse(
                true,
                member.getId(),
                member.getEmail(),
                member.getDisplayName(),
                member.getRole()
        );
    }
}
