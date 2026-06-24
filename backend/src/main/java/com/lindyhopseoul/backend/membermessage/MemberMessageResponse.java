package com.lindyhopseoul.backend.membermessage;

import java.time.Instant;

public record MemberMessageResponse(
        Long id,
        MemberMessageSenderType senderType,
        String senderName,
        String senderAdminDisplayName,
        String content,
        Instant createdAt
) {

    public static MemberMessageResponse from(MemberMessage message) {
        return new MemberMessageResponse(
                message.getId(),
                message.getSenderType(),
                senderName(message),
                senderAdminDisplayName(message),
                message.getContent(),
                message.getCreatedAt()
        );
    }

    private static String senderName(MemberMessage message) {
        if (message.getSenderType() == MemberMessageSenderType.ADMIN) {
            String adminDisplayName = senderAdminDisplayName(message);
            return adminDisplayName == null ? "Staff" : adminDisplayName;
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

    private static String senderAdminDisplayName(MemberMessage message) {
        if (message.getSenderType() != MemberMessageSenderType.ADMIN) {
            return null;
        }
        String displayName = message.getSenderAdminDisplayName();
        if (displayName == null || displayName.isBlank()) {
            return null;
        }
        String normalizedDisplayName = displayName.strip();
        return normalizedDisplayName.contains("@") ? null : normalizedDisplayName;
    }
}
