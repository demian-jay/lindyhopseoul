package com.lindyhopseoul.backend.agora;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AgoraGuestbookMessageCreateRequest(
        @NotBlank
        @Size(max = 120)
        String message
) {
}
