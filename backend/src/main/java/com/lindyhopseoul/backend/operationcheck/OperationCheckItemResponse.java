package com.lindyhopseoul.backend.operationcheck;

import java.time.Instant;
import java.util.List;

public record OperationCheckItemResponse(
        Long id,
        String content,
        String createdByUserId,
        String createdByName,
        String assignedToUserId,
        String assignedToName,
        List<OperationCheckAssigneeResponse> assignees,
        OperationCheckStatus status,
        boolean checkedYn,
        String checkedByUserId,
        String checkedByName,
        String checkedMemo,
        Instant checkedAt,
        Instant createdAt,
        Instant updatedAt,
        int commentCount,
        List<OperationCheckCommentResponse> comments,
        boolean canComplete,
        boolean canComment,
        boolean canEdit
) {

    public static OperationCheckItemResponse from(OperationCheckItem item, boolean canComplete) {
        List<OperationCheckAssigneeResponse> assignees = item.getAssignees().stream()
                .map(assignee -> new OperationCheckAssigneeResponse(
                        assignee.getAssigneeUserId(),
                        assignee.getAssigneeName()
                ))
                .toList();
        if (assignees.isEmpty() && item.getAssignedToUserId() != null) {
            assignees = List.of(new OperationCheckAssigneeResponse(item.getAssignedToUserId(), item.getAssignedToName()));
        }
        return from(item, assignees, List.of(), canComplete, false, false);
    }

    public static OperationCheckItemResponse from(
            OperationCheckItem item,
            List<OperationCheckAssigneeResponse> assignees,
            List<OperationCheckCommentResponse> comments,
            boolean canComplete,
            boolean canComment,
            boolean canEdit
    ) {
        List<OperationCheckAssigneeResponse> safeAssignees = assignees == null ? List.of() : assignees;
        List<OperationCheckCommentResponse> safeComments = comments == null ? List.of() : comments;
        return new OperationCheckItemResponse(
                item.getId(),
                item.getContent(),
                item.getCreatedByUserId(),
                item.getCreatedByName(),
                item.getAssignedToUserId(),
                item.getAssignedToName(),
                safeAssignees,
                item.getStatus(),
                item.isCheckedYn(),
                item.getCheckedByUserId(),
                item.getCheckedByName(),
                item.getCheckedMemo(),
                item.getCheckedAt(),
                item.getCreatedAt(),
                item.getUpdatedAt(),
                safeComments.size(),
                safeComments,
                canComplete,
                canComment,
                canEdit
        );
    }
}
