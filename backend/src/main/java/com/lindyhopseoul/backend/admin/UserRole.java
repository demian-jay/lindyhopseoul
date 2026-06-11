package com.lindyhopseoul.backend.admin;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "USER_ROLE_M",
        uniqueConstraints = @UniqueConstraint(
                name = "UK_USER_ROLE_M_USER_ROLE",
                columnNames = {"USER_ID", "ROLE_CODE"}
        )
)
public class UserRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "USER_ROLE_ID", nullable = false)
    private Long userRoleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_ID", nullable = false)
    private UserAccount user;

    @Enumerated(EnumType.STRING)
    @Column(name = "ROLE_CODE", nullable = false, length = 30)
    private AdminRole roleCode;

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private Instant createdAt;

    protected UserRole() {
    }

    public UserRole(UserAccount user, AdminRole roleCode) {
        this.user = user;
        this.roleCode = roleCode;
    }

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getUserRoleId() {
        return userRoleId;
    }

    public UserAccount getUser() {
        return user;
    }

    public AdminRole getRoleCode() {
        return roleCode;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
