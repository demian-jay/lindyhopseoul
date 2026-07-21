package com.lindyhopseoul.backend.admin;

import java.util.Collection;
import java.util.List;

public record AdminPrincipal(
        String userCd,
        String userNm,
        String loginId,
        AdminRole role,
        List<AdminRole> roles,
        AdminLanguage langCd,
        boolean mustChangePassword
) {

    /**
     * For callers that do not model password state — chiefly tests of unrelated
     * services. The real sign-in path goes through {@link #from(UserAccount)},
     * which reads the flag off the account.
     */
    public AdminPrincipal(
            String userCd,
            String userNm,
            String loginId,
            AdminRole role,
            List<AdminRole> roles,
            AdminLanguage langCd
    ) {
        this(userCd, userNm, loginId, role, roles, langCd, false);
    }

    public static AdminPrincipal from(UserAccount user) {
        List<AdminRole> roles = normalizeRoles(user.getRoleCodes());
        return new AdminPrincipal(
                user.getUserId(),
                user.getName(),
                user.getLoginId(),
                primaryRole(roles),
                roles,
                user.getLangCd(),
                user.mustChangePassword()
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
                adminUser.getLangCd(),
                false
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
                teacherUser.getLangCd(),
                false
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

    /**
     * Teachers read the schedule but never change it — see
     * {@link #canManageEvents()}. Participant lists are scoped separately, in
     * EventManagementService, because a teacher may only see applicants for
     * lessons they teach.
     */
    public boolean canViewEvents() {
        return hasAnyRole(AdminRole.SUPER_ADMIN, AdminRole.STAFF, AdminRole.TEACHER);
    }

    public boolean canManageEvents() {
        return hasAnyRole(AdminRole.SUPER_ADMIN, AdminRole.STAFF);
    }

    public boolean canDeleteEvents() {
        return hasRole(AdminRole.SUPER_ADMIN);
    }

    public boolean canManageMessageTemplates() {
        return hasAnyRole(AdminRole.SUPER_ADMIN, AdminRole.STAFF);
    }

    public boolean canManageMembers() {
        return hasAnyRole(AdminRole.SUPER_ADMIN, AdminRole.STAFF);
    }

    /**
     * Covers reading templates and rendering a preview to copy. Teachers get
     * this for the read-only 메시지 템플릿 조회 menu; writing stays with
     * {@link #canManageMessageTemplates()}.
     */
    public boolean canRenderPromotionMessages() {
        return hasAnyRole(AdminRole.SUPER_ADMIN, AdminRole.STAFF, AdminRole.TEACHER);
    }

    /**
     * An account with no roles keeps none. This used to fall back to a MEMBER
     * role, which read as "some minimal access" when what it actually described
     * was an account nobody had granted anything to — every permission check
     * here is a positive test, so an empty list denies everything.
     */
    private static List<AdminRole> normalizeRoles(Collection<AdminRole> roles) {
        return roles == null ? List.of() : roles.stream()
                .filter(role -> role != null)
                .distinct()
                .sorted((left, right) -> Integer.compare(rolePriority(left), rolePriority(right)))
                .toList();
    }

    private static AdminRole primaryRole(List<AdminRole> roles) {
        List<AdminRole> normalized = normalizeRoles(roles);
        return normalized.isEmpty() ? null : normalized.get(0);
    }

    private static int rolePriority(AdminRole role) {
        return switch (role) {
            case SUPER_ADMIN -> 0;
            case STAFF -> 1;
            case TEACHER -> 2;
        };
    }
}
