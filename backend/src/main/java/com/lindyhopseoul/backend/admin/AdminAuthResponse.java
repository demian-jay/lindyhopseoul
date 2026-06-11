package com.lindyhopseoul.backend.admin;

import java.util.List;

public record AdminAuthResponse(
        String accessToken,
        AdminSessionUserResponse user,
        List<AdminMenu> menus
) {

    public static AdminAuthResponse from(String accessToken, AdminPrincipal principal) {
        return new AdminAuthResponse(
                accessToken,
                AdminSessionUserResponse.from(principal),
                AdminMenu.forRoles(principal.roles())
        );
    }
}
