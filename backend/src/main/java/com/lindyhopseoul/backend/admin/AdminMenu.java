package com.lindyhopseoul.backend.admin;

import java.util.List;

public enum AdminMenu {
    DASHBOARD,
    ADMIN_USERS,
    TEACHER_USERS;

    public static List<AdminMenu> forRole(AdminRole role) {
        return switch (role) {
            case SUPER_ADMIN, STAFF -> List.of(DASHBOARD, ADMIN_USERS, TEACHER_USERS);
            case TEACHER -> List.of(DASHBOARD);
        };
    }
}
