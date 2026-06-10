package com.lindyhopseoul.backend.knowledgebase;

import java.util.Map;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record KnowledgeCategoryRequest(
        @NotNull(message = "Display order is required.")
        Integer displayOrder,

        @NotNull(message = "Translations are required.")
        Map<@NotBlank String, @Valid KnowledgeCategoryTranslationRequest> translations
) {

    public record KnowledgeCategoryTranslationRequest(
            @NotBlank(message = "Category name is required.")
            @Size(max = 120, message = "Category name must be 120 characters or fewer.")
            String name,

            @Size(max = 4000, message = "Description must be 4000 characters or fewer.")
            String description
    ) {
    }
}
