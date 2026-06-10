package com.lindyhopseoul.backend.eventmanagement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record MessageTemplateRequest(
        @NotBlank @Size(max = 120) String templateName,
        @NotNull MessageTemplateType templateType,
        @NotBlank String content,
        @NotBlank @Pattern(regexp = "Y|N") String useYn
) {
}
