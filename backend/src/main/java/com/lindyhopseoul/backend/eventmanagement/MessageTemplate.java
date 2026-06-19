package com.lindyhopseoul.backend.eventmanagement;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "MESSAGE_TEMPLATE")
public class MessageTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String templateName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private MessageTemplateType templateType;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(columnDefinition = "text")
    private String contentEn;

    @Column(nullable = false, length = 1)
    private String useYn;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected MessageTemplate() {
    }

    public static MessageTemplate create(
            String templateName,
            MessageTemplateType templateType,
            String content,
            String useYn
    ) {
        return create(templateName, templateType, content, null, useYn);
    }

    public static MessageTemplate create(
            String templateName,
            MessageTemplateType templateType,
            String content,
            String contentEn,
            String useYn
    ) {
        MessageTemplate template = new MessageTemplate();
        template.update(templateName, templateType, content, contentEn, useYn);
        return template;
    }

    public void update(String templateName, MessageTemplateType templateType, String content, String useYn) {
        update(templateName, templateType, content, contentEn, useYn);
    }

    public void update(String templateName, MessageTemplateType templateType, String content, String contentEn, String useYn) {
        this.templateName = templateName;
        this.templateType = templateType;
        this.content = content;
        this.contentEn = contentEn;
        this.useYn = useYn;
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (useYn == null || useYn.isBlank()) {
            useYn = "Y";
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getTemplateName() {
        return templateName;
    }

    public MessageTemplateType getTemplateType() {
        return templateType;
    }

    public String getContent() {
        return content;
    }

    public String getContentEn() {
        return contentEn;
    }

    public String getContentFor(String languageCode) {
        if ("en".equals(languageCode) && contentEn != null && !contentEn.isBlank()) {
            return contentEn;
        }
        return content;
    }

    public String getUseYn() {
        return useYn;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
