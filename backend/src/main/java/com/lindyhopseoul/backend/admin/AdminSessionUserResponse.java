package com.lindyhopseoul.backend.admin;

public record AdminSessionUserResponse(
        String userCd,
        String userNm,
        String loginId,
        AdminRole role,
        AdminLanguage langCd
) {

    public static AdminSessionUserResponse from(AdminPrincipal principal) {
        return new AdminSessionUserResponse(
                principal.userCd(),
                principal.userNm(),
                principal.loginId(),
                principal.role(),
                principal.langCd()
        );
    }
}
