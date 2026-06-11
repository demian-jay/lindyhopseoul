package com.lindyhopseoul.backend.knowledgebase;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "KNOWLEDGE_CATEGORY")
public class KnowledgeCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer displayOrder;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<KnowledgeCategoryTranslation> translations = new LinkedHashSet<>();

    protected KnowledgeCategory() {
    }

    public static KnowledgeCategory create(Integer displayOrder) {
        KnowledgeCategory category = new KnowledgeCategory();
        category.displayOrder = displayOrder;
        return category;
    }

    public void update(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public void replaceTranslations(Set<KnowledgeCategoryTranslation> nextTranslations) {
        Set<String> nextLanguageCodes = new LinkedHashSet<>();
        nextTranslations.forEach(translation -> nextLanguageCodes.add(translation.getLanguageCode()));

        translations.removeIf(translation -> !nextLanguageCodes.contains(translation.getLanguageCode()));

        for (KnowledgeCategoryTranslation nextTranslation : nextTranslations) {
            translations.stream()
                    .filter(translation -> translation.getLanguageCode().equals(nextTranslation.getLanguageCode()))
                    .findFirst()
                    .ifPresentOrElse(
                            translation -> translation.update(nextTranslation.getName(), nextTranslation.getDescription()),
                            () -> addTranslation(nextTranslation)
                    );
        }
    }

    public void addTranslation(KnowledgeCategoryTranslation translation) {
        translation.assignCategory(this);
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

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Set<KnowledgeCategoryTranslation> getTranslations() {
        return translations;
    }
}
