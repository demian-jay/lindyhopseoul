package com.lindyhopseoul.backend.memo;

import java.time.Instant;

public record MemoResponse(
        Long id,
        String title,
        String content,
        Instant createdAt,
        Instant updatedAt
) {

    public static MemoResponse from(Memo memo) {
        return new MemoResponse(
                memo.getId(),
                memo.getTitle(),
                memo.getContent(),
                memo.getCreatedAt(),
                memo.getUpdatedAt()
        );
    }
}
