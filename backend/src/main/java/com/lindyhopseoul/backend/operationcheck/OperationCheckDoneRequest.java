package com.lindyhopseoul.backend.operationcheck;

import jakarta.validation.constraints.Size;

public record OperationCheckDoneRequest(
        @Size(max = 1000)
        String checkedMemo
) {
}
