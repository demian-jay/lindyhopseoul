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
        name = "TEACHER_USER_M",
        uniqueConstraints = @UniqueConstraint(name = "UK_TEACHER_USER_M_LOGIN_ID", columnNames = "LOGIN_ID")
)
public class TeacherUser {

    @Id
    @Column(name = "TEACHER_USER_CD", nullable = false, length = 36)
    private String teacherUserCd;

    @Column(name = "TEACHER_USER_NM", nullable = false, length = 100)
    private String teacherUserNm;

    @Column(name = "LOGIN_ID", nullable = false, length = 60)
    private String loginId;

    @Column(name = "LOGIN_PW_HASH", nullable = false, length = 220)
    private String loginPwHash;

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

    protected TeacherUser() {
    }

    public static TeacherUser create(
            String teacherUserCd,
            String teacherUserNm,
            String loginId,
            String loginPwHash,
            AdminLanguage langCd,
            String actorCd
    ) {
        TeacherUser teacherUser = new TeacherUser();
        teacherUser.teacherUserCd = teacherUserCd;
        teacherUser.teacherUserNm = teacherUserNm;
        teacherUser.loginId = loginId;
        teacherUser.loginPwHash = loginPwHash;
        teacherUser.langCd = langCd == null ? AdminLanguage.Kor : langCd;
        teacherUser.useYn = "Y";
        teacherUser.insUs = actorCd;
        teacherUser.modUs = actorCd;
        return teacherUser;
    }

    public void update(String teacherUserNm, String loginId, AdminLanguage langCd, String useYn, String actorCd) {
        this.teacherUserNm = teacherUserNm;
        this.loginId = loginId;
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
        if (teacherUserCd == null || teacherUserCd.isBlank()) {
            teacherUserCd = UUID.randomUUID().toString();
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

    public String getTeacherUserCd() {
        return teacherUserCd;
    }

    public String getTeacherUserNm() {
        return teacherUserNm;
    }

    public String getLoginId() {
        return loginId;
    }

    public String getLoginPwHash() {
        return loginPwHash;
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
