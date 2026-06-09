package com.lindyhopseoul.backend.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AdminAccountCreateRequest(
        @NotBlank(message = "Name is required.")
        @Size(max = 100, message = "Name must be 100 characters or fewer.")
        String adminUserNm,

        @NotBlank(message = "Login ID is required.")
        @Pattern(regexp = "^[A-Za-z0-9._-]{3,40}$", message = "Login ID must be 3-40 letters, numbers, dots, underscores, or hyphens.")
        String loginId,

        @NotBlank(message = "Password is required.")
        @Size(min = 4, max = 72, message = "Password must be 4-72 characters.")
        String password,

        @NotNull(message = "Role is required.")
        AdminRole role,

        @NotNull(message = "Language is required.")
        AdminLanguage langCd
) {
}
