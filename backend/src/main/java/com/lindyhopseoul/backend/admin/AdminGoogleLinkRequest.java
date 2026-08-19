package com.lindyhopseoul.backend.admin;

import jakarta.validation.constraints.NotNull;

public record AdminGoogleLinkRequest(
        @NotNull(message = "A member must be selected.")
        Long memberId
) {
}
