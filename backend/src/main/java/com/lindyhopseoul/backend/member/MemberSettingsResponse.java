package com.lindyhopseoul.backend.member;

public record MemberSettingsResponse(
        Long memberId,
        String email,
        String displayName,
        String nickname,
        MemberPreferredLanguage preferredLanguage,
        MemberRole role
) {

    public static MemberSettingsResponse from(Member member) {
        return new MemberSettingsResponse(
                member.getId(),
                member.getEmail(),
                member.getDisplayName(),
                member.getNickname(),
                member.getPreferredLanguage(),
                member.getRole()
        );
    }
}
