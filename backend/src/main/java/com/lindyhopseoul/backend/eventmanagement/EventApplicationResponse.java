package com.lindyhopseoul.backend.eventmanagement;

import java.time.Instant;

public record EventApplicationResponse(
        Long id,
        Long eventId,
        Long lessonId,
        String applicantName,
        ApplicationContactMethod contactMethod,
        String contactValue,
        String languageCode,
        ApplicationDanceRole danceRole,
        Instant createdAt
) {

    public static EventApplicationResponse from(EventApplication application) {
        Lesson lesson = application.getLesson();
        return new EventApplicationResponse(
                application.getId(),
                application.getEvent().getId(),
                lesson == null ? null : lesson.getId(),
                application.getApplicantName(),
                application.getContactMethod(),
                application.getContactValue(),
                application.getLanguageCode(),
                application.getDanceRole(),
                application.getCreatedAt()
        );
    }
}
