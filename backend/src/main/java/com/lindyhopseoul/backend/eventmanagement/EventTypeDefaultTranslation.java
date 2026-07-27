package com.lindyhopseoul.backend.eventmanagement;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * The Korean or English copy an event of this type starts out with. Nullable
 * columns unlike {@link EventTranslation}, because a type may deliberately have
 * none — every party is written from scratch.
 */
@Entity
@Table(
        name = "EVENT_TYPE_DEFAULT_TRANSLATION",
        uniqueConstraints = @UniqueConstraint(
                name = "UK_EVENT_TYPE_DEFAULT_TRANSLATION_LANGUAGE",
                columnNames = {"EVENT_TYPE", "LANGUAGE_CODE"}
        )
)
public class EventTypeDefaultTranslation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "EVENT_TYPE", nullable = false)
    private EventTypeDefault eventTypeDefault;

    @Column(name = "LANGUAGE_CODE", nullable = false, length = 5)
    private String languageCode;

    @Column(name = "TITLE", length = 160)
    private String title;

    @Column(name = "SHORT_DESCRIPTION", length = 500)
    private String shortDescription;

    @Column(name = "DESCRIPTION", columnDefinition = "text")
    private String description;

    protected EventTypeDefaultTranslation() {
    }

    EventTypeDefaultTranslation(String languageCode, String title, String shortDescription, String description) {
        this.languageCode = languageCode;
        this.title = title;
        this.shortDescription = shortDescription;
        this.description = description;
    }

    void assignEventTypeDefault(EventTypeDefault eventTypeDefault) {
        this.eventTypeDefault = eventTypeDefault;
    }

    void update(String title, String shortDescription, String description) {
        this.title = title;
        this.shortDescription = shortDescription;
        this.description = description;
    }

    public String getLanguageCode() {
        return languageCode;
    }

    public String getTitle() {
        return title;
    }

    public String getShortDescription() {
        return shortDescription;
    }

    public String getDescription() {
        return description;
    }
}
