package com.lindyhopseoul.backend.admin;

import java.time.Instant;
import java.util.List;

public record AdminAccountResponse(
        String userId,
        String adminUserCd,
        String name,
        String adminUserNm,
        String loginId,
        String email,
        AdminRole role,
        List<AdminRole> roles,
        AdminLanguage langCd,
        String useYn,
        Instant insDt,
        String insUs,
        Instant modDt,
        String modUs
) {

    public static AdminAccountResponse from(UserAccount user) {
        List<AdminRole> roles = user.getRoleCodes();
        AdminRole role = roles.isEmpty() ? AdminRole.MEMBER : roles.get(0);
        return new AdminAccountResponse(
                user.getUserId(),
                user.getUserId(),
                user.getName(),
                user.getName(),
                user.getLoginId(),
                user.getEmail(),
                role,
                roles,
                user.getLangCd(),
                user.getUseYn(),
                user.getCreatedAt(),
                "SYSTEM",
                user.getUpdatedAt(),
                "SYSTEM"
        );
    }

    public static AdminAccountResponse from(AdminUser adminUser) {
        return new AdminAccountResponse(
                adminUser.getAdminUserCd(),
                adminUser.getAdminUserCd(),
                adminUser.getAdminUserNm(),
                adminUser.getAdminUserNm(),
                adminUser.getLoginId(),
                null,
                adminUser.getRole(),
                List.of(adminUser.getRole()),
                adminUser.getLangCd(),
                adminUser.getUseYn(),
                adminUser.getInsDt(),
                adminUser.getInsUs(),
                adminUser.getModDt(),
                adminUser.getModUs()
        );
    }
}
