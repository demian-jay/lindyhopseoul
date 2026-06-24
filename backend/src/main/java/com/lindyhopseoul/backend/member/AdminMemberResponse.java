package com.lindyhopseoul.backend.member;

import java.time.Instant;

public record AdminMemberResponse(
        Long memberId,
        String displayName,
        String nickname,
        String email,
        MemberStatus memberStatus,
        MemberPreferredLanguage preferredLanguage,
        Instant createdAt,
        Instant lastLoginAt,
        Instant withdrawnAt,
        long totalApplicationCount,
        long level1ApplicationCount,
        long level2ApplicationCount,
        long level3ApplicationCount,
        long level4ApplicationCount,
        long workshopApplicationCount
) {

    public static AdminMemberResponse from(Member member, AdminMemberApplicationSummary summary) {
        AdminMemberApplicationSummary safeSummary = summary == null ? AdminMemberApplicationSummary.empty() : summary;
        return new AdminMemberResponse(
                member.getId(),
                member.getDisplayName(),
                member.getNickname(),
                member.getEmail(),
                member.getStatus(),
                member.getPreferredLanguage(),
                member.getCreatedAt(),
                member.getLastLoginAt(),
                member.getWithdrawnAt(),
                safeSummary.totalApplicationCount(),
                safeSummary.level1ApplicationCount(),
                safeSummary.level2ApplicationCount(),
                safeSummary.level3ApplicationCount(),
                safeSummary.level4ApplicationCount(),
                safeSummary.workshopApplicationCount()
        );
    }
}
