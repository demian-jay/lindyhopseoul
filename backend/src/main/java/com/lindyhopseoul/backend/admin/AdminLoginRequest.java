package com.lindyhopseoul.backend.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminLoginRequest(
        @NotBlank(message = "Login ID is required.")
        String loginId,

        @NotBlank(message = "Password is required.")
        @Size(max = 72, message = "Password must be 72 characters or fewer.")
        String password
) {
}
