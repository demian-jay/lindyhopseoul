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
 * The Korean or English copy a lesson of this type starts out with. Nullable
 * for the same reason as {@link EventTypeDefaultTranslation}: a pairing may
 * legitimately have nothing written for it yet.
 */
@Entity
@Table(
        name = "LESSON_TYPE_DEFAULT_TRANSLATION",
        uniqueConstraints = @UniqueConstraint(
                name = "UK_LESSON_TYPE_DEFAULT_TRANSLATION_LANGUAGE",
                columnNames = {"LESSON_TYPE_DEFAULT_ID", "LANGUAGE_CODE"}
        )
)
public class LessonTypeDefaultTranslation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "LESSON_TYPE_DEFAULT_ID", nullable = false)
    private LessonTypeDefault lessonTypeDefault;

    @Column(name = "LANGUAGE_CODE", nullable = false, length = 5)
    private String languageCode;

    @Column(name = "TITLE", length = 160)
    private String title;

    @Column(name = "DESCRIPTION", columnDefinition = "text")
    private String description;

    protected LessonTypeDefaultTranslation() {
    }

    LessonTypeDefaultTranslation(String languageCode, String title, String description) {
        this.languageCode = languageCode;
        this.title = title;
        this.description = description;
    }

    void assignLessonTypeDefault(LessonTypeDefault lessonTypeDefault) {
        this.lessonTypeDefault = lessonTypeDefault;
    }

    void update(String title, String description) {
        this.title = title;
        this.description = description;
    }

    public String getLanguageCode() {
        return languageCode;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }
}
