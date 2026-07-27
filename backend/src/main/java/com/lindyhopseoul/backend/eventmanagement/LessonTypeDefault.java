package com.lindyhopseoul.backend.eventmanagement;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.LinkedHashSet;
import java.util.Optional;
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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * What one lesson type starts out as under one event type — a Level 1 under the
 * Saturday classes is not the same lesson as a Level 1 anywhere else, so the
 * defaults hang off the event type rather than off {@link LessonType} alone.
 *
 * <p>A row is not required for every combination. The form falls back to
 * {@link EventDefaultsService}'s floor for a pairing nobody has filled in.
 */
@Entity
@Table(
        name = "LESSON_TYPE_DEFAULT",
        uniqueConstraints = @UniqueConstraint(
                name = "UK_LESSON_TYPE_DEFAULT_TYPE",
                columnNames = {"EVENT_TYPE", "LESSON_TYPE"}
        )
)
public class LessonTypeDefault {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "EVENT_TYPE", nullable = false)
    private EventTypeDefault eventTypeDefault;

    @Enumerated(EnumType.STRING)
    @Column(name = "LESSON_TYPE", nullable = false, length = 30)
    private LessonType lessonType;

    @Enumerated(EnumType.STRING)
    @Column(name = "SCHEDULE_TYPE", length = 20)
    private LessonScheduleType scheduleType;

    @Column(name = "START_TIME")
    private LocalTime startTime;

    @Column(name = "END_TIME")
    private LocalTime endTime;

    @Column(name = "FEE", nullable = false, precision = 12, scale = 2)
    private BigDecimal fee = BigDecimal.ZERO;

    @Column(name = "DISPLAY_ORDER", nullable = false)
    private Integer displayOrder = 10;

    @Column(name = "ROLE_SELECTION_ENABLED", nullable = false)
    private boolean roleSelectionEnabled = false;

    @OneToMany(mappedBy = "lessonTypeDefault", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private Set<LessonTypeDefaultTranslation> translations = new LinkedHashSet<>();

    protected LessonTypeDefault() {
    }

    static LessonTypeDefault create(LessonType lessonType) {
        LessonTypeDefault lessonDefault = new LessonTypeDefault();
        lessonDefault.lessonType = lessonType;
        return lessonDefault;
    }

    void assignEventTypeDefault(EventTypeDefault eventTypeDefault) {
        this.eventTypeDefault = eventTypeDefault;
    }

    public void update(
            LessonScheduleType scheduleType,
            LocalTime startTime,
            LocalTime endTime,
            BigDecimal fee,
            Integer displayOrder,
            boolean roleSelectionEnabled
    ) {
        this.scheduleType = scheduleType;
        this.startTime = startTime;
        this.endTime = endTime;
        this.fee = fee == null ? BigDecimal.ZERO : fee;
        this.displayOrder = displayOrder;
        this.roleSelectionEnabled = roleSelectionEnabled;
    }

    public void putTranslation(String languageCode, String title, String description) {
        translations.stream()
                .filter(translation -> translation.getLanguageCode().equals(languageCode))
                .findFirst()
                .ifPresentOrElse(
                        translation -> translation.update(title, description),
                        () -> {
                            LessonTypeDefaultTranslation translation =
                                    new LessonTypeDefaultTranslation(languageCode, title, description);
                            translation.assignLessonTypeDefault(this);
                            translations.add(translation);
                        });
    }

    public Optional<LessonTypeDefaultTranslation> translation(String languageCode) {
        return translations.stream()
                .filter(translation -> translation.getLanguageCode().equals(languageCode))
                .findFirst();
    }

    public LessonType getLessonType() {
        return lessonType;
    }

    public LessonScheduleType getScheduleType() {
        return scheduleType;
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

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public boolean isRoleSelectionEnabled() {
        return roleSelectionEnabled;
    }

    public Set<LessonTypeDefaultTranslation> getTranslations() {
        return translations;
    }
}
