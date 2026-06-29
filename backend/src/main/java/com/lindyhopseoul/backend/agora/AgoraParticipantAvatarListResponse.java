package com.lindyhopseoul.backend.agora;

import java.util.List;

public record AgoraParticipantAvatarListResponse(
        List<AgoraParticipantAvatarResponse> avatars,
        int additionalCount
) {
}
