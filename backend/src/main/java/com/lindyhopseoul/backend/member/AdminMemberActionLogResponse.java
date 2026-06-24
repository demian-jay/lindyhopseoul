package com.lindyhopseoul.backend.member;

import java.time.Instant;
import java.time.LocalDate;

import com.lindyhopseoul.backend.admin.AdminRole;

public record AdminMemberActionLogResponse(
        Long id,
        Instant actionAt,
        String actorAdminId,
        String actorAdminName,
        String actorLoginId,
        AdminRole actorRole,
        Long targetMemberId,
        String targetMemberDisplayName,
        String targetMemberNickname,
        String targetMemberEmail,
        MemberStatus targetMemberStatus,
        String applicantName,
        String applicantEmail,
        Long eventId,
        String eventTitle,
        Long lessonId,
        String lessonTitle,
        LocalDate lessonStartDate,
        LocalDate lessonEndDate,
        Long eventApplicationId,
        AdminMemberActionType action,
        String summary,
        String reason
) {

    public static AdminMemberActionLogResponse from(AdminMemberActionLog log) {
        return new AdminMemberActionLogResponse(
                log.getId(),
                log.getActionAt(),
                log.getActorAdminId(),
                log.getActorAdminName(),
                log.getActorLoginId(),
                log.getActorRole(),
                log.getTargetMemberId(),
                log.getTargetMemberDisplayName(),
                log.getTargetMemberNickname(),
                log.getTargetMemberEmail(),
                log.getTargetMemberStatus(),
                log.getApplicantName(),
                log.getApplicantEmail(),
                log.getEventId(),
                log.getEventTitle(),
                log.getLessonId(),
                log.getLessonTitle(),
                log.getLessonStartDate(),
                log.getLessonEndDate(),
                log.getEventApplicationId(),
                log.getAction(),
                log.getSummary(),
                log.getReason()
        );
    }
}
