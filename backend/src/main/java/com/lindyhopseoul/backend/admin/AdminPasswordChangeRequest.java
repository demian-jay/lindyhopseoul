package com.lindyhopseoul.backend.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminPasswordChangeRequest(
        @NotBlank
        String currentPassword,

        // The floor is deliberately above the six digits handed out as a starting
        // password, so the shared one cannot be re-entered as the "new" one.
        @NotBlank
        @Size(min = 8, max = 100)
        String newPassword
) {
}
