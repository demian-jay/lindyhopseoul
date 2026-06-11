package com.lindyhopseoul.backend.admin;

import java.time.Instant;
import java.util.List;

public record TeacherAccountResponse(
        String teacherUserCd,
        String userId,
        String teacherUserNm,
        String loginId,
        AdminRole role,
        List<AdminRole> roles,
        AdminLanguage langCd,
        String useYn,
        Instant insDt,
        String insUs,
        Instant modDt,
        String modUs
) {

    public static TeacherAccountResponse from(TeacherUser teacherUser) {
        UserAccount user = teacherUser.getUserAccount();
        List<AdminRole> roles = user == null ? List.of(AdminRole.TEACHER) : user.getRoleCodes();
        return new TeacherAccountResponse(
                teacherUser.getTeacherUserCd(),
                teacherUser.getUserId(),
                teacherUser.getTeacherUserNm(),
                teacherUser.getLoginId(),
                roles.isEmpty() ? AdminRole.TEACHER : roles.get(0),
                roles,
                teacherUser.getLangCd(),
                teacherUser.getUseYn(),
                teacherUser.getInsDt(),
                teacherUser.getInsUs(),
                teacherUser.getModDt(),
                teacherUser.getModUs()
        );
    }
}
