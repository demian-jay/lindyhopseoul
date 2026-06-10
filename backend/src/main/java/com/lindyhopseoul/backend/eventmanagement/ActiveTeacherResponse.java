package com.lindyhopseoul.backend.eventmanagement;

import com.lindyhopseoul.backend.admin.AdminLanguage;
import com.lindyhopseoul.backend.admin.TeacherUser;

public record ActiveTeacherResponse(
        String teacherUserId,
        String teacherUserNm,
        String loginId,
        AdminLanguage langCd
) {

    public static ActiveTeacherResponse from(TeacherUser teacherUser) {
        return new ActiveTeacherResponse(
                teacherUser.getTeacherUserCd(),
                teacherUser.getTeacherUserNm(),
                teacherUser.getLoginId(),
                teacherUser.getLangCd()
        );
    }
}
