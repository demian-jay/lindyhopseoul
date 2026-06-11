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
        name = "KNOWLEDGE_ITEM_TRANSLATION",
        uniqueConstraints = @UniqueConstraint(
                name = "UK_KNOWLEDGE_ITEM_TRANSLATION_LANG",
                columnNames = {"KNOWLEDGE_ITEM_ID", "LANGUAGE_CODE"}
        )
)
public class KnowledgeItemTranslation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "KNOWLEDGE_ITEM_ID", nullable = false)
    private KnowledgeItem knowledgeItem;

    @Column(name = "LANGUAGE_CODE", nullable = false, length = 5)
    private String languageCode;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, length = 500)
    private String summary;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 500)
    private String tags;

    protected KnowledgeItemTranslation() {
    }

    public KnowledgeItemTranslation(String languageCode, String title, String summary, String content, String tags) {
        this.languageCode = languageCode;
        this.title = title;
        this.summary = summary;
        this.content = content;
        this.tags = tags;
    }

    void assignKnowledgeItem(KnowledgeItem knowledgeItem) {
        this.knowledgeItem = knowledgeItem;
    }

    void update(String title, String summary, String content, String tags) {
        this.title = title;
        this.summary = summary;
        this.content = content;
        this.tags = tags;
    }

    public Long getId() {
        return id;
    }

    public String getLanguageCode() {
        return languageCode;
    }

    public String getTitle() {
        return title;
    }

    public String getSummary() {
        return summary;
    }

    public String getContent() {
        return content;
    }

    public String getTags() {
        return tags;
    }
}
