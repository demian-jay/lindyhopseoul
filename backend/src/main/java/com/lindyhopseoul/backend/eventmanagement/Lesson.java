package com.lindyhopseoul.backend.eventmanagement;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.LinkedHashSet;
import java.util.Set;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "LESSON")
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "EVENT_ID", nullable = false)
    private Event event;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LessonType lessonType;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private LessonScheduleType scheduleType;

    private LocalDate startDate;

    private LocalDate endDate;

    private LocalTime startTime;

    private LocalTime endTime;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal fee;

    @Column(nullable = false, length = 10)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LessonStatus status;

    @Column(nullable = false)
    private Integer displayOrder;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<LessonTranslation> translations = new LinkedHashSet<>();

    @OrderBy("displayOrder ASC, id ASC")
    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<LessonTeacher> teachers = new LinkedHashSet<>();

    protected Lesson() {
    }

    public static Lesson create(
            Event event,
            LessonType lessonType,
            LessonScheduleType scheduleType,
            LocalDate startDate,
            LocalDate endDate,
            LocalTime startTime,
            LocalTime endTime,
            BigDecimal fee,
            String currency,
            LessonStatus status,
            Integer displayOrder
    ) {
        Lesson lesson = new Lesson();
        lesson.assignEvent(event);
        lesson.update(lessonType, scheduleType, startDate, endDate, startTime, endTime, fee, currency, status, displayOrder);
        return lesson;
    }

    public void assignEvent(Event event) {
        this.event = event;
    }

    public void update(
            LessonType lessonType,
            LessonScheduleType scheduleType,
            LocalDate startDate,
            LocalDate endDate,
            LocalTime startTime,
            LocalTime endTime,
            BigDecimal fee,
            String currency,
            LessonStatus status,
            Integer displayOrder
    ) {
        this.lessonType = lessonType;
        this.scheduleType = scheduleType;
        this.startDate = startDate;
        this.endDate = endDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.fee = fee;
        this.currency = currency;
        this.status = status;
        this.displayOrder = displayOrder;
    }

    public void replaceTranslations(Set<LessonTranslation> nextTranslations) {
        translations.clear();
        nextTranslations.forEach(this::addTranslation);
    }

    public void addTranslation(LessonTranslation translation) {
        translation.assignLesson(this);
        translations.add(translation);
    }

    public void replaceTeachers(Set<LessonTeacher> nextTeachers) {
        teachers.clear();
        nextTeachers.forEach(this::addTeacher);
    }

    public void addTeacher(LessonTeacher teacher) {
        teacher.assignLesson(this);
        teachers.add(teacher);
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Event getEvent() {
        return event;
    }

    public LessonType getLessonType() {
        return lessonType;
    }

    public LessonScheduleType getScheduleType() {
        return scheduleType;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public BigDecimal getFee() {
        return fee;
    }

    public String getCurrency() {
        return currency;
    }

    public LessonStatus getStatus() {
        return status;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Set<LessonTranslation> getTranslations() {
        return translations;
    }

    public Set<LessonTeacher> getTeachers() {
        return teachers;
    }
}
