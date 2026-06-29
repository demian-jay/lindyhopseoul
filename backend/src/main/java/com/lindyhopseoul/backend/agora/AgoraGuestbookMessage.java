package com.lindyhopseoul.backend.agora;

import java.time.Duration;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "agora_guestbook_message")
public class AgoraGuestbookMessage {

    private static final Duration DEFAULT_TTL = Duration.ofDays(7);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberId;

    @Column(nullable = false, length = 100)
    private String nicknameSnapshot;

    @Column(nullable = false, length = 120)
    private String message;

    @Column(nullable = false)
    private boolean visible;

    @Column(nullable = false)
    private boolean hiddenByAdmin;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private Instant updatedAt;

    private Instant hiddenAt;

    @Column(length = 64)
    private String hiddenByAdminId;

    protected AgoraGuestbookMessage() {
    }

    public static AgoraGuestbookMessage create(
            Long memberId,
            String nicknameSnapshot,
            String message,
            Instant createdAt,
            Instant expiresAt
    ) {
        AgoraGuestbookMessage guestbookMessage = new AgoraGuestbookMessage();
        guestbookMessage.memberId = memberId;
        guestbookMessage.nicknameSnapshot = nicknameSnapshot;
        guestbookMessage.message = message;
        guestbookMessage.visible = true;
        guestbookMessage.hiddenByAdmin = false;
        guestbookMessage.createdAt = createdAt;
        guestbookMessage.expiresAt = expiresAt;
        return guestbookMessage;
    }

    public void changeAdminHidden(boolean hidden, String adminId, Instant hiddenAt) {
        this.hiddenByAdmin = hidden;
        this.hiddenAt = hidden ? hiddenAt : null;
        this.hiddenByAdminId = hidden ? adminId : null;
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (expiresAt == null) {
            expiresAt = createdAt.plus(DEFAULT_TTL);
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

    public Long getMemberId() {
        return memberId;
    }

    public String getNicknameSnapshot() {
        return nicknameSnapshot;
    }

    public String getMessage() {
        return message;
    }

    public boolean isVisible() {
        return visible;
    }

    public boolean isHiddenByAdmin() {
        return hiddenByAdmin;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Instant getHiddenAt() {
        return hiddenAt;
    }

    public String getHiddenByAdminId() {
        return hiddenByAdminId;
    }
}
