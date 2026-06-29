package com.lindyhopseoul.backend.agora;

import java.time.Instant;

public record AgoraGuestbookMessageResponse(
        Long id,
        Long memberId,
        String nickname,
        String nicknameSnapshot,
        String message,
        boolean visible,
        boolean hiddenByAdmin,
        String type,
        Instant createdAt,
        Instant expiresAt,
        Instant updatedAt,
        Instant hiddenAt,
        String hiddenByAdminId
) {

    public static AgoraGuestbookMessageResponse from(AgoraGuestbookMessage message) {
        return new AgoraGuestbookMessageResponse(
                message.getId(),
                message.getMemberId(),
                message.getNicknameSnapshot(),
                message.getNicknameSnapshot(),
                message.getMessage(),
                message.isVisible(),
                message.isHiddenByAdmin(),
                "member",
                message.getCreatedAt(),
                message.getExpiresAt(),
                message.getUpdatedAt(),
                message.getHiddenAt(),
                message.getHiddenByAdminId()
        );
    }
}
