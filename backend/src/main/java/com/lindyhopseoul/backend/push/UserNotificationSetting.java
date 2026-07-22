package com.lindyhopseoul.backend.push;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A user's per-type on/off switches, one row per user. A missing row means "all
 * on" — see {@link #defaultsFor}. Flags a user's role does not cover are simply
 * never read: the send side only ever targets the right role.
 */
@Entity
@Table(name = "USER_NOTIFICATION_SETTING")
public class UserNotificationSetting {

    @Id
    @Column(name = "USER_ID", nullable = false, length = 36)
    private String userId;

    // Teacher
    @Column(name = "NEW_APPLICATION", nullable = false)
    private boolean newApplication = true;

    @Column(name = "LESSON_REMINDER", nullable = false)
    private boolean lessonReminder = true;

    // Staff
    @Column(name = "MEMBER_MESSAGE", nullable = false)
    private boolean memberMessage = true;

    @Column(name = "OPERATION_CHECK_TAGGED", nullable = false)
    private boolean operationCheckTagged = true;

    @Column(name = "OPERATION_CHECK_COMPLETED", nullable = false)
    private boolean operationCheckCompleted = true;

    // Applies to every type above. Off by default: it silences notifications
    // outside the quiet window entirely, so nobody should get it without asking.
    @Column(name = "QUIET_HOURS", nullable = false)
    private boolean quietHours = false;

    protected UserNotificationSetting() {
    }

    private UserNotificationSetting(String userId) {
        this.userId = userId;
    }

    /** A fresh all-on row for a user that has never touched their settings. */
    public static UserNotificationSetting defaultsFor(String userId) {
        return new UserNotificationSetting(userId);
    }

    public void update(
            boolean newApplication,
            boolean lessonReminder,
            boolean memberMessage,
            boolean operationCheckTagged,
            boolean operationCheckCompleted,
            boolean quietHours
    ) {
        this.newApplication = newApplication;
        this.lessonReminder = lessonReminder;
        this.memberMessage = memberMessage;
        this.operationCheckTagged = operationCheckTagged;
        this.operationCheckCompleted = operationCheckCompleted;
        this.quietHours = quietHours;
    }

    public String getUserId() {
        return userId;
    }

    public boolean isNewApplication() {
        return newApplication;
    }

    public boolean isLessonReminder() {
        return lessonReminder;
    }

    public boolean isMemberMessage() {
        return memberMessage;
    }

    public boolean isOperationCheckTagged() {
        return operationCheckTagged;
    }

    public boolean isOperationCheckCompleted() {
        return operationCheckCompleted;
    }

    public boolean isQuietHours() {
        return quietHours;
    }
}
