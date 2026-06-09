package com.lindyhopseoul.backend.admin;

import java.time.Instant;

public record TeacherAccountResponse(
        String teacherUserCd,
        String teacherUserNm,
        String loginId,
        AdminRole role,
        AdminLanguage langCd,
        String useYn,
        Instant insDt,
        String insUs,
        Instant modDt,
        String modUs
) {

    public static TeacherAccountResponse from(TeacherUser teacherUser) {
        return new TeacherAccountResponse(
                teacherUser.getTeacherUserCd(),
                teacherUser.getTeacherUserNm(),
                teacherUser.getLoginId(),
                AdminRole.TEACHER,
                teacherUser.getLangCd(),
                teacherUser.getUseYn(),
                teacherUser.getInsDt(),
                teacherUser.getInsUs(),
                teacherUser.getModDt(),
                teacherUser.getModUs()
        );
    }
}
