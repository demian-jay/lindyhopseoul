package com.lindyhopseoul.backend.membermessage;

import java.util.List;

public record AdminMemberMessageSendResponse(
        int requestedCount,
        int sentCount,
        int skippedCount,
        List<SkippedMember> skippedMembers
) {
    public record SkippedMember(
            Long memberId,
            String reason
    ) {
    }
}
