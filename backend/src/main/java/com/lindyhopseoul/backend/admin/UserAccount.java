package com.lindyhopseoul.backend.admin;

import java.time.Instant;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "USER_M",
        uniqueConstraints = @UniqueConstraint(name = "UK_USER_M_LOGIN_ID", columnNames = "LOGIN_ID")
)
public class UserAccount {

    @Id
    @Column(name = "USER_ID", nullable = false, length = 36)
    private String userId;

    @Column(name = "LOGIN_ID", nullable = false, length = 60)
    private String loginId;

    @Column(name = "USER_NM", nullable = false, length = 100)
    private String name;

    @Column(name = "EMAIL", length = 200)
    private String email;

    @Column(name = "PASSWORD", nullable = false, length = 220)
    private String password;

    @Column(name = "USE_YN", nullable = false, length = 1)
    private String useYn;

    @Enumerated(EnumType.STRING)
    @Column(name = "LANG_CD", length = 3)
    private AdminLanguage langCd;

    /**
     * When the account holder last set their own password. Null means they never
     * have — the password is whatever a super admin handed them — so they are made
     * to change it before they can do anything else. A timestamp rather than a
     * flag so it also answers "how old is this password".
     */
    @Column(name = "PWD_CHANGED_AT")
    private Instant pwdChangedAt;

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "UPDATED_AT", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private Set<UserRole> roles = new LinkedHashSet<>();

    protected UserAccount() {
    }

    public static UserAccount create(
            String userId,
            String name,
            String loginId,
            String email,
            String password,
            AdminLanguage langCd,
            Collection<AdminRole> roles
    ) {
        UserAccount user = new UserAccount();
        user.userId = userId;
        user.name = name;
        user.loginId = loginId;
        user.email = email;
        user.password = password;
        user.langCd = langCd == null ? AdminLanguage.Kor : langCd;
        user.useYn = "Y";
        user.replaceRoles(roles);
        return user;
    }

    public void update(String name, String loginId, String email, AdminLanguage langCd, String useYn) {
        this.name = name;
        this.loginId = loginId;
        this.email = email;
        this.langCd = langCd == null ? AdminLanguage.Kor : langCd;
        this.useYn = useYn;
    }

    /**
     * The account holder setting their own password. Clears the pending change.
     */
    public void changePassword(String password) {
        this.password = password;
        this.pwdChangedAt = Instant.now();
    }

    /**
     * Someone else setting this account's password. The holder did not choose it,
     * so leave it pending: they must replace it before the account is usable.
     */
    public void resetPassword(String password) {
        this.password = password;
        this.pwdChangedAt = null;
    }

    public boolean mustChangePassword() {
        return pwdChangedAt == null;
    }

    public void deactivate() {
        this.useYn = "N";
    }

    public void replaceRoles(Collection<AdminRole> nextRoles) {
        Set<AdminRole> nextRoleCodes = new LinkedHashSet<>();
        if (nextRoles != null) {
            nextRoles.stream()
                    .filter(role -> role != null)
                    .distinct()
                    .forEach(nextRoleCodes::add);
        }

        roles.removeIf(userRole -> !nextRoleCodes.contains(userRole.getRoleCode()));

        Set<AdminRole> currentRoleCodes = new LinkedHashSet<>();
        roles.forEach(userRole -> currentRoleCodes.add(userRole.getRoleCode()));
        nextRoleCodes.stream()
                .filter(role -> !currentRoleCodes.contains(role))
                .forEach(role -> roles.add(new UserRole(this, role)));
    }

    public void addRole(AdminRole role) {
        if (role == null || hasRole(role)) {
            return;
        }
        roles.add(new UserRole(this, role));
    }

    public boolean hasRole(AdminRole role) {
        return roles.stream().anyMatch(userRole -> userRole.getRoleCode() == role);
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (userId == null || userId.isBlank()) {
            userId = UUID.randomUUID().toString();
        }
        if (useYn == null || useYn.isBlank()) {
            useYn = "Y";
        }
        if (langCd == null) {
            langCd = AdminLanguage.Kor;
        }
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public String getUserId() {
        return userId;
    }

    public String getLoginId() {
        return loginId;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public String getUseYn() {
        return useYn;
    }

    public AdminLanguage getLangCd() {
        return langCd == null ? AdminLanguage.Kor : langCd;
    }

    public Instant getPwdChangedAt() {
        return pwdChangedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Set<UserRole> getRoles() {
        return roles;
    }

    public List<AdminRole> getRoleCodes() {
        return roles.stream()
                .map(UserRole::getRoleCode)
                .sorted(Comparator.comparingInt(UserAccount::rolePriority))
                .toList();
    }

    public boolean isActive() {
        return "Y".equals(useYn);
    }

    private static int rolePriority(AdminRole role) {
        return switch (role) {
            case SUPER_ADMIN -> 0;
            case STAFF -> 1;
            case TEACHER -> 2;
            case MEMBER -> 3;
        };
    }
}
