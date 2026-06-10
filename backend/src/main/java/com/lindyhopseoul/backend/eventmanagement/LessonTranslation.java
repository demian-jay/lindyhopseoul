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
        name = "LESSON_TRANSLATION",
        uniqueConstraints = @UniqueConstraint(
                name = "UK_LESSON_TRANSLATION_LANGUAGE",
                columnNames = {"LESSON_ID", "LANGUAGE_CODE"}
        )
)
public class LessonTranslation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "LESSON_ID", nullable = false)
    private Lesson lesson;

    @Column(nullable = false, length = 5)
    private String languageCode;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    protected LessonTranslation() {
    }

    public LessonTranslation(String languageCode, String title, String description) {
        this.languageCode = languageCode;
        this.title = title;
        this.description = description;
    }

    public void assignLesson(Lesson lesson) {
        this.lesson = lesson;
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
