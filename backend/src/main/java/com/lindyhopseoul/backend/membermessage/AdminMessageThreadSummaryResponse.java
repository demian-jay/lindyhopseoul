package com.lindyhopseoul.backend.membermessage;

import java.time.Instant;

import com.lindyhopseoul.backend.member.Member;
import com.lindyhopseoul.backend.member.MemberStatus;

public record AdminMessageThreadSummaryResponse(
        Long threadId,
        Long memberId,
        String memberEmail,
        String memberDisplayName,
        String memberNickname,
        MemberStatus memberStatus,
        String lastMessagePreview,
        Instant lastMessageAt
) {

    public static AdminMessageThreadSummaryResponse from(MemberMessageThread thread, MemberMessage lastMessage) {
        Member member = thread.getMember();
        return new AdminMessageThreadSummaryResponse(
                thread.getId(),
                member.getId(),
                member.getEmail(),
                member.getDisplayName(),
                member.getNickname(),
                member.getStatus(),
                preview(lastMessage == null ? "" : lastMessage.getContent()),
                thread.getLastMessageAt()
        );
    }

    private static String preview(String content) {
        if (content == null) {
            return "";
        }
        String normalized = content.strip();
        return normalized.length() <= 80 ? normalized : normalized.substring(0, 80);
    }
}
