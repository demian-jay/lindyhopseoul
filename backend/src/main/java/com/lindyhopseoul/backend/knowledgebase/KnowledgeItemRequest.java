package com.lindyhopseoul.backend.knowledgebase;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record KnowledgeItemRequest(
        @NotNull(message = "Category ID is required.")
        Long categoryId,

        @NotNull(message = "Status is required.")
        KnowledgeItemStatus status,

        @NotNull(message = "Display order is required.")
        Integer displayOrder,

        LocalDate decisionDate,

        LocalDate effectiveFrom,

        LocalDate effectiveTo,

        @Size(max = 500, message = "Source note must be 500 characters or fewer.")
        String sourceNote,

        @NotNull(message = "Translations are required.")
        Map<@NotBlank String, @Valid KnowledgeItemTranslationRequest> translations
) {

    public record KnowledgeItemTranslationRequest(
            @NotBlank(message = "Title is required.")
            @Size(max = 160, message = "Title must be 160 characters or fewer.")
            String title,

            @NotBlank(message = "Summary is required.")
            @Size(max = 500, message = "Summary must be 500 characters or fewer.")
            String summary,

            @NotBlank(message = "Content is required.")
            @Size(max = 20000, message = "Content must be 20000 characters or fewer.")
            String content,

            @Size(max = 30, message = "Tags must contain 30 entries or fewer.")
            List<@Size(max = 40, message = "Each tag must be 40 characters or fewer.") String> tags
    ) {
    }
}
