package com.lindyhopseoul.backend.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminLoginIdChangeRequest(
        @NotBlank
        @Size(min = 3, max = 60)
        String newLoginId
) {
}
