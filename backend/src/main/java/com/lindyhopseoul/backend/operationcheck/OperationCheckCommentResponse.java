package com.lindyhopseoul.backend.operationcheck;

import java.time.Instant;

public record OperationCheckCommentResponse(
        Long id,
        String content,
        String createdByUserId,
        String createdByName,
        Instant createdAt,
        Instant updatedAt
) {

    public static OperationCheckCommentResponse from(OperationCheckComment comment) {
        return new OperationCheckCommentResponse(
                comment.getId(),
                comment.getContent(),
                comment.getCreatedByUserId(),
                comment.getCreatedByName(),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }
}
