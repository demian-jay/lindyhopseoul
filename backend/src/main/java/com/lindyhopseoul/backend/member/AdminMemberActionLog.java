package com.lindyhopseoul.backend.member;

import java.time.Instant;
import java.time.LocalDate;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminRole;
import com.lindyhopseoul.backend.eventmanagement.ApplicationContactMethod;
import com.lindyhopseoul.backend.eventmanagement.Event;
import com.lindyhopseoul.backend.eventmanagement.EventApplication;
import com.lindyhopseoul.backend.eventmanagement.Lesson;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "ADMIN_MEMBER_ACTION_LOG")
public class AdminMemberActionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private Instant actionAt;

    @Column(nullable = false, length = 80)
    private String actorAdminId;

    @Column(nullable = false, length = 100)
    private String actorAdminName;

    @Column(length = 100)
    private String actorLoginId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30, columnDefinition = "varchar(30)")
    private AdminRole actorRole;

    @Column
    private Long targetMemberId;

    @Column(length = 100)
    private String targetMemberDisplayName;

    @Column(length = 100)
    private String targetMemberNickname;

    @Column(length = 200)
    private String targetMemberEmail;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, columnDefinition = "varchar(20)")
    private MemberStatus targetMemberStatus;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, columnDefinition = "varchar(20)")
    private MemberStatus previousMemberStatus;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, columnDefinition = "varchar(20)")
    private MemberStatus nextMemberStatus;

    @Column(length = 100)
    private String applicantName;

    @Column(length = 200)
    private String applicantEmail;

    @Column
    private Long eventId;

    @Column(length = 200)
    private String eventTitle;

    @Column
    private Long lessonId;

    @Column(length = 200)
    private String lessonTitle;

    @Column
    private LocalDate lessonStartDate;

    @Column
    private LocalDate lessonEndDate;

    @Column
    private Long eventApplicationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50, columnDefinition = "varchar(50)")
    private AdminMemberActionType action;

    @Column(nullable = false, length = 500)
    private String summary;

    @Column(length = 1000)
    private String reason;

    protected AdminMemberActionLog() {
    }

    public static AdminMemberActionLog lessonApplicationRemoved(
            AdminPrincipal actor,
            EventApplication application,
            String eventTitle,
            String lessonTitle,
            String reason
    ) {
        Event event = application.getEvent();
        Lesson lesson = application.getLesson();
        Member member = application.getMember();
        String applicantEmail = application.getContactMethod() == ApplicationContactMethod.EMAIL
                ? cleanNullable(application.getContactValue())
                : null;

        AdminMemberActionLog log = new AdminMemberActionLog();
        log.actorAdminId = actor.userCd();
        log.actorAdminName = actor.userNm();
        log.actorLoginId = actor.loginId();
        log.actorRole = actor.role();
        log.targetMemberId = member == null ? null : member.getId();
        log.targetMemberDisplayName = member == null ? application.getApplicantName() : member.getDisplayName();
        log.targetMemberNickname = member == null ? null : member.getNickname();
        log.targetMemberEmail = member == null ? applicantEmail : member.getEmail();
        log.targetMemberStatus = member == null ? null : member.getStatus();
        log.applicantName = application.getApplicantName();
        log.applicantEmail = applicantEmail;
        log.eventId = event.getId();
        log.eventTitle = cleanNullable(eventTitle);
        log.lessonId = lesson == null ? null : lesson.getId();
        log.lessonTitle = cleanNullable(lessonTitle);
        log.lessonStartDate = lesson == null ? event.getStartDate() : lesson.getStartDate();
        log.lessonEndDate = lesson == null ? event.getEndDate() : lesson.getEndDate();
        log.eventApplicationId = application.getId();
        log.action = AdminMemberActionType.LESSON_APPLICATION_REMOVED;
        log.summary = "수업 신청 목록에서 제거함";
        log.reason = cleanNullable(reason);
        return log;
    }

    public static AdminMemberActionLog memberStatusChanged(
            AdminPrincipal actor,
            Member member,
            MemberStatus previousStatus,
            MemberStatus nextStatus,
            AdminMemberActionType action,
            String reason
    ) {
        AdminMemberActionLog log = new AdminMemberActionLog();
        log.actorAdminId = actor.userCd();
        log.actorAdminName = actor.userNm();
        log.actorLoginId = actor.loginId();
        log.actorRole = actor.role();
        log.targetMemberId = member.getId();
        log.targetMemberDisplayName = member.getDisplayName();
        log.targetMemberNickname = member.getNickname();
        log.targetMemberEmail = member.getEmail();
        log.targetMemberStatus = nextStatus;
        log.previousMemberStatus = previousStatus;
        log.nextMemberStatus = nextStatus;
        log.action = action;
        log.summary = switch (action) {
            case MEMBER_SUSPENDED -> "회원 계정을 비활성화함";
            case MEMBER_REACTIVATED -> "회원 계정을 재활성화함";
            default -> "회원 상태를 변경함";
        };
        log.reason = cleanNullable(reason);
        return log;
    }

    @PrePersist
    void prePersist() {
        if (actionAt == null) {
            actionAt = Instant.now();
        }
    }

    private static String cleanNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    public Long getId() {
        return id;
    }

    public Instant getActionAt() {
        return actionAt;
    }

    public String getActorAdminId() {
        return actorAdminId;
    }

    public String getActorAdminName() {
        return actorAdminName;
    }

    public String getActorLoginId() {
        return actorLoginId;
    }

    public AdminRole getActorRole() {
        return actorRole;
    }

    public Long getTargetMemberId() {
        return targetMemberId;
    }

    public String getTargetMemberDisplayName() {
        return targetMemberDisplayName;
    }

    public String getTargetMemberNickname() {
        return targetMemberNickname;
    }

    public String getTargetMemberEmail() {
        return targetMemberEmail;
    }

    public MemberStatus getTargetMemberStatus() {
        return targetMemberStatus;
    }

    public MemberStatus getPreviousMemberStatus() {
        return previousMemberStatus;
    }

    public MemberStatus getNextMemberStatus() {
        return nextMemberStatus;
    }

    public String getApplicantName() {
        return applicantName;
    }

    public String getApplicantEmail() {
        return applicantEmail;
    }

    public Long getEventId() {
        return eventId;
    }

    public String getEventTitle() {
        return eventTitle;
    }

    public Long getLessonId() {
        return lessonId;
    }

    public String getLessonTitle() {
        return lessonTitle;
    }

    public LocalDate getLessonStartDate() {
        return lessonStartDate;
    }

    public LocalDate getLessonEndDate() {
        return lessonEndDate;
    }

    public Long getEventApplicationId() {
        return eventApplicationId;
    }

    public AdminMemberActionType getAction() {
        return action;
    }

    public String getSummary() {
        return summary;
    }

    public String getReason() {
        return reason;
    }
}
