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

@Entity
@Table(
        name = "SWINGPOP_EVENT_TRANSLATION",
        uniqueConstraints = @UniqueConstraint(
                name = "UK_SWINGPOP_EVENT_TRANSLATION_LANGUAGE",
                columnNames = {"EVENT_ID", "LANGUAGE_CODE"}
        )
)
public class EventTranslation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "EVENT_ID", nullable = false)
    private Event event;

    @Column(nullable = false, length = 5)
    private String languageCode;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, length = 500)
    private String shortDescription;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    protected EventTranslation() {
    }

    public EventTranslation(String languageCode, String title, String shortDescription, String description) {
        this.languageCode = languageCode;
        this.title = title;
        this.shortDescription = shortDescription;
        this.description = description;
    }

    public void assignEvent(Event event) {
        this.event = event;
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
