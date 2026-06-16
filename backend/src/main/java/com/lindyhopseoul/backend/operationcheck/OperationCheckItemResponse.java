package com.lindyhopseoul.backend.operationcheck;

import java.time.Instant;

public record OperationCheckItemResponse(
        Long id,
        String content,
        String createdByUserId,
        String createdByName,
        String assignedToUserId,
        String assignedToName,
        OperationCheckStatus status,
        boolean checkedYn,
        String checkedByUserId,
        String checkedByName,
        String checkedMemo,
        Instant checkedAt,
        Instant createdAt,
        Instant updatedAt,
        boolean canComplete
) {

    public static OperationCheckItemResponse from(OperationCheckItem item, boolean canComplete) {
        return new OperationCheckItemResponse(
                item.getId(),
                item.getContent(),
                item.getCreatedByUserId(),
                item.getCreatedByName(),
                item.getAssignedToUserId(),
                item.getAssignedToName(),
                item.getStatus(),
                item.isCheckedYn(),
                item.getCheckedByUserId(),
                item.getCheckedByName(),
                item.getCheckedMemo(),
                item.getCheckedAt(),
                item.getCreatedAt(),
                item.getUpdatedAt(),
                canComplete
        );
    }
}
