package com.lindyhopseoul.backend.eventmanagement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MessageRenderRequest(
        @NotNull Long eventId,
        @NotBlank String languageCode
) {
}
