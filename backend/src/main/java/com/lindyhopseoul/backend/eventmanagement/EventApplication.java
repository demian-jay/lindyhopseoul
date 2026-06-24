package com.lindyhopseoul.backend.eventmanagement;

import java.time.Instant;

import com.lindyhopseoul.backend.member.Member;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "EVENT_APPLICATION")
public class EventApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "EVENT_ID", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "LESSON_ID")
    private Lesson lesson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MEMBER_ID")
    private Member member;

    @Column(nullable = false, length = 100)
    private String applicantName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30, columnDefinition = "varchar(30)")
    private ApplicationContactMethod contactMethod;

    @Column(nullable = false, length = 200)
    private String contactValue;

    @Column(length = 2000)
    private String requestMemo;

    @Column(nullable = false, length = 10)
    private String languageCode;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, columnDefinition = "varchar(20)")
    private ApplicationDanceRole danceRole;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "varchar(20) default 'ACTIVE'")
    private EventApplicationStatus status;

    @Column
    private Instant removedAt;

    @Column(length = 80)
    private String removedBy;

    @Column(length = 1000)
    private String removedReason;

    protected EventApplication() {
    }

    public static EventApplication create(
            Event event,
            Lesson lesson,
            String applicantName,
            ApplicationContactMethod contactMethod,
            String contactValue,
            String requestMemo,
            String languageCode,
            ApplicationDanceRole danceRole
    ) {
        return create(event, lesson, null, applicantName, contactMethod, contactValue, requestMemo, languageCode, danceRole);
    }

    public static EventApplication create(
            Event event,
            Lesson lesson,
            Member member,
            String applicantName,
            ApplicationContactMethod contactMethod,
            String contactValue,
            String requestMemo,
            String languageCode,
            ApplicationDanceRole danceRole
    ) {
        EventApplication application = new EventApplication();
        application.event = event;
        application.lesson = lesson;
        application.member = member;
        application.applicantName = applicantName;
        application.contactMethod = contactMethod;
        application.contactValue = contactValue;
        application.requestMemo = requestMemo;
        application.languageCode = languageCode;
        application.danceRole = danceRole;
        application.status = EventApplicationStatus.ACTIVE;
        return application;
    }

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = EventApplicationStatus.ACTIVE;
        }
    }

    public void markRemoved(String removedBy, String removedReason) {
        this.status = EventApplicationStatus.REMOVED;
        this.removedAt = Instant.now();
        this.removedBy = removedBy;
        this.removedReason = removedReason;
    }

    public boolean isActive() {
        return status == null || status == EventApplicationStatus.ACTIVE;
    }

    public Long getId() {
        return id;
    }

    public Event getEvent() {
        return event;
    }

    public Lesson getLesson() {
        return lesson;
    }

    public Member getMember() {
        return member;
    }

    public String getApplicantName() {
        return applicantName;
    }

    public ApplicationContactMethod getContactMethod() {
        return contactMethod;
    }

    public String getContactValue() {
        return contactValue;
    }

    public String getRequestMemo() {
        return requestMemo;
    }

    public String getLanguageCode() {
        return languageCode;
    }

    public ApplicationDanceRole getDanceRole() {
        return danceRole;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public EventApplicationStatus getStatus() {
        return status == null ? EventApplicationStatus.ACTIVE : status;
    }

    public Instant getRemovedAt() {
        return removedAt;
    }

    public String getRemovedBy() {
        return removedBy;
    }

    public String getRemovedReason() {
        return removedReason;
    }
}
