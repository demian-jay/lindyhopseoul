package com.lindyhopseoul.backend.knowledgebase;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public record KnowledgeItemResponse(
        Long id,
        Long categoryId,
        KnowledgeItemStatus status,
        Integer displayOrder,
        LocalDate decisionDate,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        String sourceNote,
        Instant createdAt,
        Instant updatedAt,
        Map<String, KnowledgeItemTranslationResponse> translations
) {

    public static KnowledgeItemResponse from(KnowledgeItem item) {
        return new KnowledgeItemResponse(
                item.getId(),
                item.getCategory().getId(),
                item.getStatus(),
                item.getDisplayOrder(),
                item.getDecisionDate(),
                item.getEffectiveFrom(),
                item.getEffectiveTo(),
                item.getSourceNote(),
                item.getCreatedAt(),
                item.getUpdatedAt(),
                translationsFrom(item)
        );
    }

    private static Map<String, KnowledgeItemTranslationResponse> translationsFrom(KnowledgeItem item) {
        Map<String, KnowledgeItemTranslationResponse> responses = new TreeMap<>();
        item.getTranslations().forEach(translation -> responses.put(
                translation.getLanguageCode(),
                new KnowledgeItemTranslationResponse(
                        translation.getTitle(),
                        translation.getSummary(),
                        translation.getContent(),
                        parseTags(translation.getTags())
                )
        ));
        return responses;
    }

    private static List<String> parseTags(String tags) {
        if (tags == null || tags.isBlank()) {
            return List.of();
        }

        return Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(tag -> !tag.isBlank())
                .toList();
    }

    public record KnowledgeItemTranslationResponse(
            String title,
            String summary,
            String content,
            List<String> tags
    ) {
    }
}
