package com.lindyhopseoul.backend.agora;

import jakarta.validation.constraints.NotNull;

public record AgoraGuestbookMessageHiddenRequest(
        @NotNull
        Boolean hidden
) {
}
