package com.lindyhopseoul.backend.operationcheck;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OperationCheckUpdateRequest(
        @NotBlank
        @Size(max = 2000)
        String content,

        List<String> assignedToUserIds,

        String assignedToUserId
) {
}
