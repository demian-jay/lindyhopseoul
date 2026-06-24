package com.lindyhopseoul.backend.admin;

import java.util.Collection;
import java.util.List;

public record AdminPrincipal(
        String userCd,
        String userNm,
        String loginId,
        AdminRole role,
        List<AdminRole> roles,
        AdminLanguage langCd
) {

    public static AdminPrincipal from(UserAccount user) {
        List<AdminRole> roles = normalizeRoles(user.getRoleCodes());
        return new AdminPrincipal(
                user.getUserId(),
                user.getName(),
                user.getLoginId(),
                primaryRole(roles),
                roles,
                user.getLangCd()
        );
    }

    public static AdminPrincipal from(AdminUser adminUser) {
        List<AdminRole> roles = normalizeRoles(List.of(adminUser.getRole()));
        return new AdminPrincipal(
                adminUser.getAdminUserCd(),
                adminUser.getAdminUserNm(),
                adminUser.getLoginId(),
                primaryRole(roles),
                roles,
                adminUser.getLangCd()
        );
    }

    public static AdminPrincipal from(TeacherUser teacherUser) {
        if (teacherUser.getUserAccount() != null) {
            return from(teacherUser.getUserAccount());
        }
        List<AdminRole> roles = List.of(AdminRole.TEACHER);
        return new AdminPrincipal(
                teacherUser.getTeacherUserCd(),
                teacherUser.getTeacherUserNm(),
                teacherUser.getLoginId(),
                AdminRole.TEACHER,
                roles,
                teacherUser.getLangCd()
        );
    }

    public boolean hasRole(AdminRole role) {
        return roles != null && roles.contains(role);
    }

    public boolean hasAnyRole(AdminRole... requiredRoles) {
        if (requiredRoles == null) {
            return false;
        }
        for (AdminRole requiredRole : requiredRoles) {
            if (hasRole(requiredRole)) {
                return true;
            }
        }
        return false;
    }

    public boolean canManageAccounts() {
        return hasAnyRole(AdminRole.SUPER_ADMIN, AdminRole.STAFF);
    }

    public boolean canManageEvents() {
        return hasAnyRole(AdminRole.SUPER_ADMIN, AdminRole.STAFF);
    }

    public boolean canDeleteEvents() {
        return hasRole(AdminRole.SUPER_ADMIN);
    }

    public boolean canManageMessageTemplates() {
        return hasRole(AdminRole.SUPER_ADMIN);
    }

    public boolean canManageMembers() {
        return hasAnyRole(AdminRole.SUPER_ADMIN, AdminRole.STAFF);
    }

    public boolean canRenderPromotionMessages() {
        return hasAnyRole(AdminRole.SUPER_ADMIN, AdminRole.STAFF);
    }

    private static List<AdminRole> normalizeRoles(Collection<AdminRole> roles) {
        List<AdminRole> normalized = roles == null ? List.of() : roles.stream()
                .filter(role -> role != null)
                .distinct()
                .sorted((left, right) -> Integer.compare(rolePriority(left), rolePriority(right)))
                .toList();
        return normalized.isEmpty() ? List.of(AdminRole.MEMBER) : normalized;
    }

    private static AdminRole primaryRole(List<AdminRole> roles) {
        return normalizeRoles(roles).get(0);
    }

    private static int rolePriority(AdminRole role) {
        return switch (role) {
            case SUPER_ADMIN -> 0;
            case STAFF -> 1;
            case TEACHER -> 2;
            case MEMBER -> 3;
        };
    }
}
