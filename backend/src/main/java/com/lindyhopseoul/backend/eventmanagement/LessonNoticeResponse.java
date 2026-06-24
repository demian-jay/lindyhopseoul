package com.lindyhopseoul.backend.eventmanagement;

import java.time.Instant;

public record LessonNoticeResponse(
        Long id,
        Long lessonId,
        String content,
        String authorNickname,
        String authorDisplayName,
        Instant createdAt
) {

    public static LessonNoticeResponse from(LessonNotice notice) {
        return new LessonNoticeResponse(
                notice.getId(),
                notice.getLesson().getId(),
                notice.getContent(),
                notice.getAuthorNicknameSnapshot(),
                notice.getAuthorDisplayNameSnapshot(),
                notice.getCreatedAt()
        );
    }
}
