package com.lindyhopseoul.backend.eventmanagement;

import java.time.Instant;

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

    @Column(nullable = false, length = 100)
    private String applicantName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30, columnDefinition = "varchar(30)")
    private ApplicationContactMethod contactMethod;

    @Column(nullable = false, length = 200)
    private String contactValue;

    @Column(nullable = false, length = 10)
    private String languageCode;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected EventApplication() {
    }

    public static EventApplication create(
            Event event,
            Lesson lesson,
            String applicantName,
            ApplicationContactMethod contactMethod,
            String contactValue,
            String languageCode
    ) {
        EventApplication application = new EventApplication();
        application.event = event;
        application.lesson = lesson;
        application.applicantName = applicantName;
        application.contactMethod = contactMethod;
        application.contactValue = contactValue;
        application.languageCode = languageCode;
        return application;
    }

    @PrePersist
    void prePersist() {
        createdAt = Instant.now();
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

    public String getApplicantName() {
        return applicantName;
    }

    public ApplicationContactMethod getContactMethod() {
        return contactMethod;
    }

    public String getContactValue() {
        return contactValue;
    }

    public String getLanguageCode() {
        return languageCode;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
