package com.lindyhopseoul.backend.agora;

import java.time.Instant;

public record AgoraNoticeResponse(
        Long id,
        String titleKo,
        String titleEn,
        String contentKo,
        String contentEn,
        boolean important,
        boolean visible,
        String createdBy,
        Instant createdAt,
        Instant updatedAt
) {

    public static AgoraNoticeResponse from(AgoraNotice notice) {
        return new AgoraNoticeResponse(
                notice.getId(),
                notice.getTitleKo(),
                notice.getTitleEn(),
                notice.getContentKo(),
                notice.getContentEn(),
                notice.isImportant(),
                notice.isVisible(),
                notice.getCreatedBy(),
                notice.getCreatedAt(),
                notice.getUpdatedAt()
        );
    }
}
