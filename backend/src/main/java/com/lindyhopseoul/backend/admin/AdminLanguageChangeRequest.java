package com.lindyhopseoul.backend.admin;

import jakarta.validation.constraints.NotNull;

public record AdminLanguageChangeRequest(
        @NotNull
        AdminLanguage langCd
) {
}
