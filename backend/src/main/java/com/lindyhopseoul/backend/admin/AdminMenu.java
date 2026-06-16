package com.lindyhopseoul.backend.admin;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public enum AdminMenu {
    DASHBOARD,
    OPERATION_CHECK,
    EVENT_MANAGEMENT,
    KNOWLEDGE_BASE,
    MESSAGE_TEMPLATES,
    ADMIN_USERS,
    TEACHER_USERS;

    public static List<AdminMenu> forRoles(Collection<AdminRole> roles) {
        if (roles == null || roles.isEmpty()) {
            return List.of(DASHBOARD);
        }
        if (roles.contains(AdminRole.SUPER_ADMIN)) {
            return forRole(AdminRole.SUPER_ADMIN);
        }

        Set<AdminMenu> menus = new LinkedHashSet<>();
        roles.forEach(role -> menus.addAll(forRole(role)));
        return menus.stream().toList();
    }

    public static List<AdminMenu> forRole(AdminRole role) {
        return switch (role) {
            case SUPER_ADMIN -> List.of(
                    DASHBOARD,
                    OPERATION_CHECK,
                    EVENT_MANAGEMENT,
                    KNOWLEDGE_BASE,
                    MESSAGE_TEMPLATES,
                    ADMIN_USERS
            );
            case STAFF -> List.of(DASHBOARD, OPERATION_CHECK, EVENT_MANAGEMENT, KNOWLEDGE_BASE, ADMIN_USERS);
            case TEACHER -> List.of(DASHBOARD);
            case MEMBER -> List.of(DASHBOARD, KNOWLEDGE_BASE);
        };
    }
}
