package com.lindyhopseoul.backend.knowledgebase;

import java.time.Instant;
import java.time.LocalDate;
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
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "KNOWLEDGE_ITEM")
public class KnowledgeItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "CATEGORY_ID", nullable = false)
    private KnowledgeCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private KnowledgeItemStatus status;

    @Column(nullable = false)
    private Integer displayOrder;

    private LocalDate decisionDate;

    private LocalDate effectiveFrom;

    private LocalDate effectiveTo;

    @Column(length = 500)
    private String sourceNote;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "knowledgeItem", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<KnowledgeItemTranslation> translations = new LinkedHashSet<>();

    protected KnowledgeItem() {
    }

    public static KnowledgeItem create(
            KnowledgeCategory category,
            KnowledgeItemStatus status,
            Integer displayOrder,
            LocalDate decisionDate,
            LocalDate effectiveFrom,
            LocalDate effectiveTo,
            String sourceNote
    ) {
        KnowledgeItem item = new KnowledgeItem();
        item.update(category, status, displayOrder, decisionDate, effectiveFrom, effectiveTo, sourceNote);
        return item;
    }

    public void update(
            KnowledgeCategory category,
            KnowledgeItemStatus status,
            Integer displayOrder,
            LocalDate decisionDate,
            LocalDate effectiveFrom,
            LocalDate effectiveTo,
            String sourceNote
    ) {
        this.category = category;
        this.status = status;
        this.displayOrder = displayOrder;
        this.decisionDate = decisionDate;
        this.effectiveFrom = effectiveFrom;
        this.effectiveTo = effectiveTo;
        this.sourceNote = sourceNote;
    }

    public void replaceTranslations(Set<KnowledgeItemTranslation> nextTranslations) {
        translations.clear();
        nextTranslations.forEach(this::addTranslation);
    }

    public void addTranslation(KnowledgeItemTranslation translation) {
        translation.assignKnowledgeItem(this);
        translations.add(translation);
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

    public KnowledgeCategory getCategory() {
        return category;
    }

    public KnowledgeItemStatus getStatus() {
        return status;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public LocalDate getDecisionDate() {
        return decisionDate;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public LocalDate getEffectiveTo() {
        return effectiveTo;
    }

    public String getSourceNote() {
        return sourceNote;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Set<KnowledgeItemTranslation> getTranslations() {
        return translations;
    }
}
