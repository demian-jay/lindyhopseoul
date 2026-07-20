package com.lindyhopseoul.backend.admin;

import java.util.List;

public record AdminSessionUserResponse(
        String userId,
        String userCd,
        String name,
        String userNm,
        String loginId,
        AdminRole role,
        List<AdminRole> roles,
        AdminLanguage langCd,
        boolean mustChangePassword
) {

    public static AdminSessionUserResponse from(AdminPrincipal principal) {
        return new AdminSessionUserResponse(
                principal.userCd(),
                principal.userCd(),
                principal.userNm(),
                principal.userNm(),
                principal.loginId(),
                principal.role(),
                principal.roles(),
                principal.langCd(),
                principal.mustChangePassword()
        );
    }
}
