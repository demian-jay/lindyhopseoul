package com.lindyhopseoul.backend.knowledgebase;

import java.util.List;

public record KnowledgeBaseBootstrapResponse(
        String defaultLanguage,
        List<String> supportedLanguages,
        List<KnowledgeCategoryResponse> categories,
        List<KnowledgeItemResponse> items
) {
}
