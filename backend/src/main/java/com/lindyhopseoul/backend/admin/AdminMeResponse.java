package com.lindyhopseoul.backend.admin;

import java.util.List;

public record AdminMeResponse(
        AdminSessionUserResponse user,
        List<AdminMenu> menus
) {

    public static AdminMeResponse from(AdminPrincipal principal) {
        return new AdminMeResponse(
                AdminSessionUserResponse.from(principal),
                AdminMenu.forRoles(principal.roles())
        );
    }
}
