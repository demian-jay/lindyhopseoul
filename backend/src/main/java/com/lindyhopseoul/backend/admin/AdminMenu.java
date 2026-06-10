package com.lindyhopseoul.backend.admin;

import java.util.List;

public enum AdminMenu {
    DASHBOARD,
    EVENT_MANAGEMENT,
    KNOWLEDGE_BASE,
    MESSAGE_TEMPLATES,
    ADMIN_USERS,
    TEACHER_USERS;

    public static List<AdminMenu> forRole(AdminRole role) {
        return switch (role) {
            case SUPER_ADMIN -> List.of(
                    DASHBOARD,
                    EVENT_MANAGEMENT,
                    KNOWLEDGE_BASE,
                    MESSAGE_TEMPLATES,
                    ADMIN_USERS,
                    TEACHER_USERS
            );
            case STAFF -> List.of(DASHBOARD, EVENT_MANAGEMENT, KNOWLEDGE_BASE, ADMIN_USERS, TEACHER_USERS);
            case TEACHER -> List.of(DASHBOARD, KNOWLEDGE_BASE);
        };
    }
}
