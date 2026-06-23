package com.lindyhopseoul.backend.member;

import java.time.Instant;
import java.util.Locale;

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
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "member",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_member_provider_provider_id",
                columnNames = {"provider", "provider_id"}
        )
)
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 20)
    private MemberProvider provider;

    @Column(name = "provider_id", nullable = false, length = 120)
    private String providerId;

    @Column(name = "email", nullable = false, length = 200)
    private String email;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(name = "nickname", length = 20)
    private String nickname;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_language", nullable = false, length = 2, columnDefinition = "varchar(2) default 'KO'")
    private MemberPreferredLanguage preferredLanguage;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private MemberRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private MemberStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "withdrawn_at")
    private Instant withdrawnAt;

    protected Member() {
    }

    public static Member createGoogle(String providerId, String email, String displayName, Instant loginAt) {
        Member member = new Member();
        member.provider = MemberProvider.GOOGLE;
        member.providerId = providerId;
        member.email = normalizeEmail(email);
        member.displayName = normalizeDisplayName(displayName, member.email);
        member.role = MemberRole.USER;
        member.status = MemberStatus.ACTIVE;
        member.lastLoginAt = loginAt;
        return member;
    }

    public void recordLogin(String email, String displayName, Instant loginAt) {
        this.email = normalizeEmail(email);
        this.displayName = normalizeDisplayName(displayName, this.email);
        this.lastLoginAt = loginAt;
    }

    public void updateSettings(String nickname, MemberPreferredLanguage preferredLanguage) {
        this.nickname = normalizeNickname(nickname);
        if (preferredLanguage != null) {
            this.preferredLanguage = preferredLanguage;
        }
    }

    public void withdraw(Instant withdrawnAt) {
        String safeId = id == null ? "unknown" : String.valueOf(id);
        this.provider = MemberProvider.WITHDRAWN;
        this.providerId = "withdrawn_" + safeId;
        this.email = "withdrawn_member_" + safeId + "@swingpop.local";
        this.role = MemberRole.USER;
        this.status = MemberStatus.WITHDRAWN;
        this.withdrawnAt = withdrawnAt == null ? Instant.now() : withdrawnAt;
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (preferredLanguage == null) {
            preferredLanguage = MemberPreferredLanguage.KO;
        }
        if (role == null) {
            role = MemberRole.USER;
        }
        if (status == null) {
            status = MemberStatus.ACTIVE;
        }
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (lastLoginAt == null) {
            lastLoginAt = now;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    private static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private static String normalizeDisplayName(String displayName, String fallbackEmail) {
        String normalized = displayName == null ? "" : displayName.trim();
        if (!normalized.isBlank()) {
            return normalized.length() <= 100 ? normalized : normalized.substring(0, 100);
        }
        if (fallbackEmail != null && !fallbackEmail.isBlank()) {
            return fallbackEmail.length() <= 100 ? fallbackEmail : fallbackEmail.substring(0, 100);
        }
        return "Google User";
    }

    private static String normalizeNickname(String nickname) {
        if (nickname == null) {
            return null;
        }
        String normalized = nickname.trim();
        return normalized.isBlank() ? null : normalized;
    }

    public Long getId() {
        return id;
    }

    public MemberProvider getProvider() {
        return provider;
    }

    public String getProviderId() {
        return providerId;
    }

    public String getEmail() {
        return email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getNickname() {
        return nickname;
    }

    public MemberPreferredLanguage getPreferredLanguage() {
        return preferredLanguage == null ? MemberPreferredLanguage.KO : preferredLanguage;
    }

    public MemberRole getRole() {
        return role;
    }

    public MemberStatus getStatus() {
        return status;
    }

    public boolean isActive() {
        return status == MemberStatus.ACTIVE;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Instant getLastLoginAt() {
        return lastLoginAt;
    }

    public Instant getWithdrawnAt() {
        return withdrawnAt;
    }
}
