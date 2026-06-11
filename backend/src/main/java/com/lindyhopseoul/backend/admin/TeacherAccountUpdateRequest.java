package com.lindyhopseoul.backend.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record TeacherAccountUpdateRequest(
        @NotBlank(message = "Name is required.")
        @Size(max = 100, message = "Name must be 100 characters or fewer.")
        String teacherUserNm,

        String userId,

        @Pattern(regexp = "^[A-Za-z0-9._-]{3,40}$", message = "Login ID must be 3-40 letters, numbers, dots, underscores, or hyphens.")
        String loginId,

        @Size(min = 4, max = 72, message = "Password must be 4-72 characters.")
        String password,

        @NotNull(message = "Language is required.")
        AdminLanguage langCd,

        @NotBlank(message = "Use Y/N is required.")
        @Pattern(regexp = "^[YN]$", message = "Use Y/N must be Y or N.")
        String useYn
) {
}
