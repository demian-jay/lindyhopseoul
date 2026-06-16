package com.lindyhopseoul.backend.operationcheck;

public record OperationCheckSummaryResponse(
        long openTotalCount,
        long openAssignedCount
) {
}
