package com.lindyhopseoul.backend.eventmanagement;

public record LessonTeacherResponse(
        String teacherUserId,
        String teacherUserNm,
        String role,
        Integer displayOrder
) {

    public static LessonTeacherResponse from(LessonTeacher lessonTeacher) {
        return new LessonTeacherResponse(
                lessonTeacher.getTeacherUser().getTeacherUserCd(),
                lessonTeacher.getTeacherUser().getTeacherUserNm(),
                lessonTeacher.getRole(),
                lessonTeacher.getDisplayOrder()
        );
    }
}
