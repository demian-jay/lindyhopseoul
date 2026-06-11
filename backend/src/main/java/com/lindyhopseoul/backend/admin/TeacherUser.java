package com.lindyhopseoul.backend.admin;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "TEACHER_USER_M")
public class TeacherUser {

    @Id
    @Column(name = "TEACHER_USER_CD", nullable = false, length = 36)
    private String teacherUserCd;

    @Column(name = "TEACHER_USER_NM", nullable = false, length = 100)
    private String teacherUserNm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_ID")
    private UserAccount userAccount;

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

    public static TeacherUser createProfile(
            String teacherUserCd,
            String teacherUserNm,
            UserAccount userAccount,
            String actorCd
    ) {
        TeacherUser teacherUser = new TeacherUser();
        teacherUser.teacherUserCd = teacherUserCd;
        teacherUser.teacherUserNm = teacherUserNm;
        teacherUser.userAccount = userAccount;
        teacherUser.useYn = "Y";
        teacherUser.insUs = actorCd;
        teacherUser.modUs = actorCd;
        return teacherUser;
    }

    public void updateProfile(String teacherUserNm, UserAccount userAccount, String useYn, String actorCd) {
        this.teacherUserNm = teacherUserNm;
        this.userAccount = userAccount;
        this.useYn = useYn;
        this.modUs = actorCd;
    }

    public void linkUserAccount(UserAccount userAccount, String actorCd) {
        this.userAccount = userAccount;
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

    public UserAccount getUserAccount() {
        return userAccount;
    }

    public String getUserId() {
        return userAccount == null ? null : userAccount.getUserId();
    }

    public String getLoginId() {
        return userAccount == null ? null : userAccount.getLoginId();
    }

    public AdminLanguage getLangCd() {
        return userAccount == null ? AdminLanguage.Kor : userAccount.getLangCd();
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
