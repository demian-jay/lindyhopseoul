package com.lindyhopseoul.backend.admin;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "ADMIN_USER_M",
        uniqueConstraints = @UniqueConstraint(name = "UK_ADMIN_USER_M_LOGIN_ID", columnNames = "LOGIN_ID")
)
public class AdminUser {

    @Id
    @Column(name = "ADMIN_USER_CD", nullable = false, length = 36)
    private String adminUserCd;

    @Column(name = "ADMIN_USER_NM", nullable = false, length = 100)
    private String adminUserNm;

    @Column(name = "LOGIN_ID", nullable = false, length = 60)
    private String loginId;

    @Column(name = "LOGIN_PW_HASH", nullable = false, length = 220)
    private String loginPwHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "ADMIN_ROLE", nullable = false, length = 30)
    private AdminRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "LANG_CD", length = 3)
    private AdminLanguage langCd;

    @Column(name = "USE_YN", nullable = false, length = 1)
    private String useYn;

    @Column(name = "INS_DT", nullable = false, updatable = false)
    private Instant insDt;

    @Column(name = "INS_US", nullable = false, updatable = false, length = 36)
    private String insUs;

    @Column(name = "MOD_DT", nullable = false)
    private Instant modDt;

    @Column(name = "MOD_US", nullable = false, length = 36)
    private String modUs;

    protected AdminUser() {
    }

    public static AdminUser create(
            String adminUserCd,
            String adminUserNm,
            String loginId,
            String loginPwHash,
            AdminRole role,
            AdminLanguage langCd,
            String actorCd
    ) {
        AdminUser adminUser = new AdminUser();
        adminUser.adminUserCd = adminUserCd;
        adminUser.adminUserNm = adminUserNm;
        adminUser.loginId = loginId;
        adminUser.loginPwHash = loginPwHash;
        adminUser.role = role;
        adminUser.langCd = langCd == null ? AdminLanguage.Kor : langCd;
        adminUser.useYn = "Y";
        adminUser.insUs = actorCd;
        adminUser.modUs = actorCd;
        return adminUser;
    }

    public void update(
            String adminUserNm,
            String loginId,
            AdminRole role,
            AdminLanguage langCd,
            String useYn,
            String actorCd
    ) {
        this.adminUserNm = adminUserNm;
        this.loginId = loginId;
        this.role = role;
        this.langCd = langCd == null ? AdminLanguage.Kor : langCd;
        this.useYn = useYn;
        this.modUs = actorCd;
    }

    public void changePassword(String loginPwHash, String actorCd) {
        this.loginPwHash = loginPwHash;
        this.modUs = actorCd;
    }

    public void deactivate(String actorCd) {
        this.useYn = "N";
        this.modUs = actorCd;
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (adminUserCd == null || adminUserCd.isBlank()) {
            adminUserCd = UUID.randomUUID().toString();
        }
        if (useYn == null || useYn.isBlank()) {
            useYn = "Y";
        }
        if (langCd == null) {
            langCd = AdminLanguage.Kor;
        }
        if (insUs == null || insUs.isBlank()) {
            insUs = "SYSTEM";
        }
        if (modUs == null || modUs.isBlank()) {
            modUs = insUs;
        }
        insDt = now;
        modDt = now;
    }

    @PreUpdate
    void preUpdate() {
        modDt = Instant.now();
    }

    public String getAdminUserCd() {
        return adminUserCd;
    }

    public String getAdminUserNm() {
        return adminUserNm;
    }

    public String getLoginId() {
        return loginId;
    }

    public String getLoginPwHash() {
        return loginPwHash;
    }

    public AdminRole getRole() {
        return role;
    }

    public AdminLanguage getLangCd() {
        return langCd == null ? AdminLanguage.Kor : langCd;
    }

    public String getUseYn() {
        return useYn;
    }

    public Instant getInsDt() {
        return insDt;
    }

    public String getInsUs() {
        return insUs;
    }

    public Instant getModDt() {
        return modDt;
    }

    public String getModUs() {
        return modUs;
    }

    public boolean isActive() {
        return "Y".equals(useYn);
    }
}
