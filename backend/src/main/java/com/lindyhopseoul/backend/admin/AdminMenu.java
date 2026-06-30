package com.lindyhopseoul.backend.admin;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public enum AdminMenu {
    DASHBOARD,
    OPERATION_CHECK,
    EVENT_MANAGEMENT,
    CORKBOARD,
    MEMBER_MESSAGES,
    MEMBER_ACTION_LOGS,
    KNOWLEDGE_BASE,
    MESSAGE_TEMPLATES,
    ADMIN_USERS,
    MEMBERS,
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
                    CORKBOARD,
                    MEMBER_MESSAGES,
                    MEMBER_ACTION_LOGS,
                    KNOWLEDGE_BASE,
                    MESSAGE_TEMPLATES,
                    ADMIN_USERS,
                    MEMBERS
            );
            case STAFF -> List.of(
                    DASHBOARD,
                    OPERATION_CHECK,
                    EVENT_MANAGEMENT,
                    CORKBOARD,
                    MEMBER_MESSAGES,
                    KNOWLEDGE_BASE,
                    ADMIN_USERS,
                    MEMBERS
            );
            case TEACHER -> List.of(DASHBOARD);
            case MEMBER -> List.of(DASHBOARD, KNOWLEDGE_BASE);
        };
    }
}
