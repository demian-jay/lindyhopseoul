package com.lindyhopseoul.backend.eventmanagement;

import java.time.Instant;
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
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/**
 * What the event registration form fills itself in with for a given event type.
 *
 * <p>These used to be a literal in {@code src/EventManagementPanel.jsx}, which
 * meant a fee change or a new venue address was a code change and a deploy. The
 * shape here is the shape that literal had, so the form behaves the same.
 *
 * <p>Keyed by the event type itself: there are exactly as many rows as the enum
 * has constants, and the settings screen edits them rather than adding to them.
 */
@Entity
@Table(name = "EVENT_TYPE_DEFAULT")
public class EventTypeDefault {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "EVENT_TYPE", nullable = false, length = 30)
    private EventType eventType;

    /**
     * The recurring day this type falls on, {@code java.time.DayOfWeek}-free and
     * stored the way the form wants it: 0 is Sunday, matching JavaScript's
     * {@code Date#getDay}. Null for one-offs — a party has no weekday, and the
     * form leaves its dates empty rather than guessing.
     */
    @Column(name = "WEEKDAY")
    private Integer weekday;

    @Column(name = "DISPLAY_ORDER", nullable = false)
    private Integer displayOrder;

    @Column(name = "START_TIME")
    private LocalTime startTime;

    @Column(name = "END_TIME")
    private LocalTime endTime;

    @Column(name = "LOCATION", length = 300)
    private String location;

    @Column(name = "ADDRESS_INFO_ENABLED", nullable = false)
    private boolean addressInfoEnabled = true;

    @Column(name = "GOOGLE_MAP_URL", length = 500)
    private String googleMapUrl;

    @Column(name = "NAVER_MAP_URL", length = 500)
    private String naverMapUrl;

    /**
     * Which lesson the "add a lesson" form starts on for this event type. Null
     * for types that do not usually carry one.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "DEFAULT_LESSON_TYPE", length = 30)
    private LessonType defaultLessonType;

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "UPDATED_AT", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "eventTypeDefault", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private Set<EventTypeDefaultTranslation> translations = new LinkedHashSet<>();

    @OneToMany(mappedBy = "eventTypeDefault", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private Set<LessonTypeDefault> lessonDefaults = new LinkedHashSet<>();

    protected EventTypeDefault() {
    }

    public static EventTypeDefault create(EventType eventType, Integer displayOrder) {
        EventTypeDefault eventTypeDefault = new EventTypeDefault();
        eventTypeDefault.eventType = eventType;
        eventTypeDefault.displayOrder = displayOrder;
        return eventTypeDefault;
    }

    public void update(
            Integer weekday,
            Integer displayOrder,
            LocalTime startTime,
            LocalTime endTime,
            String location,
            boolean addressInfoEnabled,
            String googleMapUrl,
            String naverMapUrl,
            LessonType defaultLessonType
    ) {
        this.weekday = weekday;
        this.displayOrder = displayOrder;
        this.startTime = startTime;
        this.endTime = endTime;
        this.location = location;
        this.addressInfoEnabled = addressInfoEnabled;
        this.googleMapUrl = googleMapUrl;
        this.naverMapUrl = naverMapUrl;
        this.defaultLessonType = defaultLessonType;
    }

    public void putTranslation(String languageCode, String title, String shortDescription, String description) {
        translations.stream()
                .filter(translation -> translation.getLanguageCode().equals(languageCode))
                .findFirst()
                .ifPresentOrElse(
                        translation -> translation.update(title, shortDescription, description),
                        () -> {
                            EventTypeDefaultTranslation translation =
                                    new EventTypeDefaultTranslation(languageCode, title, shortDescription, description);
                            translation.assignEventTypeDefault(this);
                            translations.add(translation);
                        });
    }

    public LessonTypeDefault lessonDefaultFor(LessonType lessonType) {
        return lessonDefaults.stream()
                .filter(lessonDefault -> lessonDefault.getLessonType() == lessonType)
                .findFirst()
                .orElseGet(() -> {
                    LessonTypeDefault lessonDefault = LessonTypeDefault.create(lessonType);
                    lessonDefault.assignEventTypeDefault(this);
                    lessonDefaults.add(lessonDefault);
                    return lessonDefault;
                });
    }

    public Optional<EventTypeDefaultTranslation> translation(String languageCode) {
        return translations.stream()
                .filter(translation -> translation.getLanguageCode().equals(languageCode))
                .findFirst();
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

    public EventType getEventType() {
        return eventType;
    }

    public Integer getWeekday() {
        return weekday;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public String getLocation() {
        return location;
    }

    public boolean isAddressInfoEnabled() {
        return addressInfoEnabled;
    }

    public String getGoogleMapUrl() {
        return googleMapUrl;
    }

    public String getNaverMapUrl() {
        return naverMapUrl;
    }

    public LessonType getDefaultLessonType() {
        return defaultLessonType;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Set<EventTypeDefaultTranslation> getTranslations() {
        return translations;
    }

    public Set<LessonTypeDefault> getLessonDefaults() {
        return lessonDefaults;
    }
}
