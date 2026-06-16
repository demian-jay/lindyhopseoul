package com.lindyhopseoul.backend.operationcheck;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OperationCheckCreateRequest(
        @NotBlank
        @Size(max = 2000)
        String content,

        String assignedToUserId
) {
}
