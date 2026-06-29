package com.lindyhopseoul.backend.agora;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "agora_notice")
public class AgoraNotice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String titleKo;

    @Column(nullable = false, length = 160)
    private String titleEn;

    @Lob
    @Column(nullable = false, length = 2000)
    private String contentKo;

    @Lob
    @Column(nullable = false, length = 2000)
    private String contentEn;

    @Column(nullable = false)
    private boolean important;

    @Column(nullable = false)
    private boolean visible;

    @Column(nullable = false, length = 64, updatable = false)
    private String createdBy;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected AgoraNotice() {
    }

    public static AgoraNotice create(
            String titleKo,
            String titleEn,
            String contentKo,
            String contentEn,
            boolean important,
            boolean visible,
            String createdBy
    ) {
        AgoraNotice notice = new AgoraNotice();
        notice.titleKo = titleKo;
        notice.titleEn = titleEn;
        notice.contentKo = contentKo;
        notice.contentEn = contentEn;
        notice.important = important;
        notice.visible = visible;
        notice.createdBy = createdBy;
        return notice;
    }

    public void update(
            String titleKo,
            String titleEn,
            String contentKo,
            String contentEn,
            boolean important,
            boolean visible
    ) {
        this.titleKo = titleKo;
        this.titleEn = titleEn;
        this.contentKo = contentKo;
        this.contentEn = contentEn;
        this.important = important;
        this.visible = visible;
    }

    public void changeVisibility(boolean visible) {
        this.visible = visible;
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getTitleKo() {
        return titleKo;
    }

    public String getTitleEn() {
        return titleEn;
    }

    public String getContentKo() {
        return contentKo;
    }

    public String getContentEn() {
        return contentEn;
    }

    public boolean isImportant() {
        return important;
    }

    public boolean isVisible() {
        return visible;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
