package com.lindyhopseoul.backend.eventmanagement;

import java.time.Instant;

import com.lindyhopseoul.backend.member.Member;
import com.lindyhopseoul.backend.member.MemberStatus;

public record EventApplicationResponse(
        Long id,
        Long eventId,
        Long lessonId,
        String applicantName,
        ApplicationContactMethod contactMethod,
        String contactValue,
        String requestMemo,
        String languageCode,
        ApplicationDanceRole danceRole,
        MemberStatus memberStatus,
        Instant createdAt
) {

    public static EventApplicationResponse from(EventApplication application) {
        Lesson lesson = application.getLesson();
        Member member = application.getMember();
        return new EventApplicationResponse(
                application.getId(),
                application.getEvent().getId(),
                lesson == null ? null : lesson.getId(),
                application.getApplicantName(),
                application.getContactMethod(),
                application.getContactValue(),
                application.getRequestMemo(),
                application.getLanguageCode(),
                application.getDanceRole(),
                member == null ? null : member.getStatus(),
                application.getCreatedAt()
        );
    }
}
