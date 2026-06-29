package com.lindyhopseoul.backend.agora;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AgoraNoticeRequest(
        @NotBlank
        @Size(max = 160)
        String titleKo,

        @NotBlank
        @Size(max = 160)
        String titleEn,

        @NotBlank
        @Size(max = 2000)
        String contentKo,

        @NotBlank
        @Size(max = 2000)
        String contentEn,

        boolean important,

        boolean visible
) {
}
