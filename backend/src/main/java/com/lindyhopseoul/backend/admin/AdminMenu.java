package com.lindyhopseoul.backend.admin;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public enum AdminMenu {
    DASHBOARD,
    OPERATION_CHECK,
    // Reading and registering are separate menus because they carry different
    // audiences: teachers need the schedule, only staff may change it. The old
    // combined EVENT_MANAGEMENT / MESSAGE_TEMPLATES entries split into these.
    EVENT_VIEW,
    EVENT_REGISTRATION,
    CORKBOARD,
    MEMBER_MESSAGES,
    MEMBER_ACTION_LOGS,
    KNOWLEDGE_BASE,
    KNOWLEDGE_BASE_REGISTRATION,
    MESSAGE_TEMPLATE_VIEW,
    MESSAGE_TEMPLATE_REGISTRATION,
    ADMIN_USERS,
    MEMBERS,
    TEACHER_USERS,
    // What the event and lesson registration forms open with. Super admin only:
    // changing a default changes what every later registration starts from,
    // which reaches further than registering one event does.
    EVENT_DEFAULTS,
    // Which member account each admin may also sign in as. Super admin only, and
    // for a stronger reason than the menus above: a link here is a way into an
    // admin account, so granting one is the same kind of act as creating the
    // account was.
    GOOGLE_LINKS;

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
            // Ordered to match the sidebar's categories: 운영진, then 수업관리,
            // then 시스템. DASHBOARD stays in the list because it is still the
            // landing view — the sidebar renders it as a home button, not a row.
            case SUPER_ADMIN -> List.of(
                    DASHBOARD,
                    OPERATION_CHECK,
                    MEMBER_MESSAGES,
                    KNOWLEDGE_BASE,
                    MEMBERS,
                    EVENT_VIEW,
                    MESSAGE_TEMPLATE_VIEW,
                    CORKBOARD,
                    ADMIN_USERS,
                    EVENT_REGISTRATION,
                    MEMBER_ACTION_LOGS,
                    MESSAGE_TEMPLATE_REGISTRATION,
                    KNOWLEDGE_BASE_REGISTRATION,
                    EVENT_DEFAULTS,
                    GOOGLE_LINKS
            );
            // Same as super admin minus MEMBER_ACTION_LOGS, EVENT_DEFAULTS and
            // GOOGLE_LINKS, which stay super admin only.
            case STAFF -> List.of(
                    DASHBOARD,
                    OPERATION_CHECK,
                    MEMBER_MESSAGES,
                    KNOWLEDGE_BASE,
                    MEMBERS,
                    EVENT_VIEW,
                    MESSAGE_TEMPLATE_VIEW,
                    CORKBOARD,
                    ADMIN_USERS,
                    EVENT_REGISTRATION,
                    MESSAGE_TEMPLATE_REGISTRATION,
                    KNOWLEDGE_BASE_REGISTRATION
            );
            case TEACHER -> List.of(DASHBOARD, EVENT_VIEW, MESSAGE_TEMPLATE_VIEW);
        };
    }
}
