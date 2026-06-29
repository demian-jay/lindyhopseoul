package com.lindyhopseoul.backend.agora;

import jakarta.validation.constraints.NotNull;

public record AgoraNoticeVisibilityRequest(
        @NotNull
        Boolean visible
) {
}
