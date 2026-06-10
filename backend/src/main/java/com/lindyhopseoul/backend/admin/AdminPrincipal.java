package com.lindyhopseoul.backend.admin;

public record AdminPrincipal(
        String userCd,
        String userNm,
        String loginId,
        AdminRole role,
        AdminLanguage langCd
) {

    public static AdminPrincipal from(AdminUser adminUser) {
        return new AdminPrincipal(
                adminUser.getAdminUserCd(),
                adminUser.getAdminUserNm(),
                adminUser.getLoginId(),
                adminUser.getRole(),
                adminUser.getLangCd()
        );
    }

    public static AdminPrincipal from(TeacherUser teacherUser) {
        return new AdminPrincipal(
                teacherUser.getTeacherUserCd(),
                teacherUser.getTeacherUserNm(),
                teacherUser.getLoginId(),
                AdminRole.TEACHER,
                teacherUser.getLangCd()
        );
    }

    public boolean canManageAccounts() {
        return role == AdminRole.SUPER_ADMIN || role == AdminRole.STAFF;
    }

    public boolean canManageEvents() {
        return role == AdminRole.SUPER_ADMIN || role == AdminRole.STAFF;
    }

    public boolean canDeleteEvents() {
        return role == AdminRole.SUPER_ADMIN;
    }

    public boolean canManageMessageTemplates() {
        return role == AdminRole.SUPER_ADMIN;
    }

    public boolean canRenderPromotionMessages() {
        return role == AdminRole.SUPER_ADMIN || role == AdminRole.STAFF;
    }
}
