package com.lindyhopseoul.backend.knowledgebase;

import java.time.Instant;
import java.util.Map;
import java.util.TreeMap;

public record KnowledgeCategoryResponse(
        Long id,
        Integer displayOrder,
        Instant createdAt,
        Instant updatedAt,
        Map<String, KnowledgeCategoryTranslationResponse> translations
) {

    public static KnowledgeCategoryResponse from(KnowledgeCategory category) {
        return new KnowledgeCategoryResponse(
                category.getId(),
                category.getDisplayOrder(),
                category.getCreatedAt(),
                category.getUpdatedAt(),
                translationsFrom(category)
        );
    }

    private static Map<String, KnowledgeCategoryTranslationResponse> translationsFrom(KnowledgeCategory category) {
        Map<String, KnowledgeCategoryTranslationResponse> responses = new TreeMap<>();
        category.getTranslations().forEach(translation -> responses.put(
                translation.getLanguageCode(),
                new KnowledgeCategoryTranslationResponse(translation.getName(), translation.getDescription())
        ));
        return responses;
    }

    public record KnowledgeCategoryTranslationResponse(
            String name,
            String description
    ) {
    }
}
