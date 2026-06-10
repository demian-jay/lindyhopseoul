package com.lindyhopseoul.backend.knowledgebase;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "KNOWLEDGE_CATEGORY_TRANSLATION",
        uniqueConstraints = @UniqueConstraint(
                name = "UK_KNOWLEDGE_CATEGORY_TRANSLATION_LANG",
                columnNames = {"CATEGORY_ID", "LANGUAGE_CODE"}
        )
)
public class KnowledgeCategoryTranslation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "CATEGORY_ID", nullable = false)
    private KnowledgeCategory category;

    @Column(name = "LANGUAGE_CODE", nullable = false, length = 5)
    private String languageCode;

    @Column(nullable = false, length = 120)
    private String name;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;

    protected KnowledgeCategoryTranslation() {
    }

    public KnowledgeCategoryTranslation(String languageCode, String name, String description) {
        this.languageCode = languageCode;
        this.name = name;
        this.description = description;
    }

    void assignCategory(KnowledgeCategory category) {
        this.category = category;
    }

    public Long getId() {
        return id;
    }

    public String getLanguageCode() {
        return languageCode;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }
}
