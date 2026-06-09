package com.lindyhopseoul.backend.admin;

import java.time.Instant;

public record AdminAccountResponse(
        String adminUserCd,
        String adminUserNm,
        String loginId,
        AdminRole role,
        AdminLanguage langCd,
        String useYn,
        Instant insDt,
        String insUs,
        Instant modDt,
        String modUs
) {

    public static AdminAccountResponse from(AdminUser adminUser) {
        return new AdminAccountResponse(
                adminUser.getAdminUserCd(),
                adminUser.getAdminUserNm(),
                adminUser.getLoginId(),
                adminUser.getRole(),
                adminUser.getLangCd(),
                adminUser.getUseYn(),
                adminUser.getInsDt(),
                adminUser.getInsUs(),
                adminUser.getModDt(),
                adminUser.getModUs()
        );
    }
}
