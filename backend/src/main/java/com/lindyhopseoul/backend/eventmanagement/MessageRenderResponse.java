package com.lindyhopseoul.backend.eventmanagement;

public record MessageRenderResponse(
        Long templateId,
        Long eventId,
        String languageCode,
        String renderedText
) {
}
