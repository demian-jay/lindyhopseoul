package com.lindyhopseoul.backend.agora;

public record AgoraParticipantAvatarResponse(
        String id,
        Long memberId,
        String nickname,
        String initial,
        String role,
        String classTitle,
        String positionGroup
) {
}
