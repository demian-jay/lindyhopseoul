package com.lindyhopseoul.backend.membermessage;

import java.time.Instant;

public record MemberMessageResponse(
        Long id,
        MemberMessageSenderType senderType,
        String senderName,
        String content,
        Instant createdAt
) {

    public static MemberMessageResponse from(MemberMessage message) {
        return new MemberMessageResponse(
                message.getId(),
                message.getSenderType(),
                senderName(message),
                message.getContent(),
                message.getCreatedAt()
        );
    }

    private static String senderName(MemberMessage message) {
        if (message.getSenderType() == MemberMessageSenderType.ADMIN) {
            return "Swingpop 운영진";
        }
        if (message.getSenderMember() == null) {
            return "Member";
        }
        if (message.getSenderMember().getNickname() != null && !message.getSenderMember().getNickname().isBlank()) {
            return message.getSenderMember().getNickname();
        }
        if (message.getSenderMember().getDisplayName() != null && !message.getSenderMember().getDisplayName().isBlank()) {
            return message.getSenderMember().getDisplayName();
        }
        return message.getSenderMember().getEmail();
    }
}
