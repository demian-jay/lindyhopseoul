package com.lindyhopseoul.backend.eventmanagement;

import java.time.Instant;

public record MessageTemplateResponse(
        Long id,
        String templateName,
        MessageTemplateType templateType,
        String content,
        String useYn,
        Instant createdAt,
        Instant updatedAt
) {

    public static MessageTemplateResponse from(MessageTemplate template) {
        return new MessageTemplateResponse(
                template.getId(),
                template.getTemplateName(),
                template.getTemplateType(),
                template.getContent(),
                template.getUseYn(),
                template.getCreatedAt(),
                template.getUpdatedAt()
        );
    }
}
