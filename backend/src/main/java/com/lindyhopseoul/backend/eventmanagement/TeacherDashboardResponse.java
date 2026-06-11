package com.lindyhopseoul.backend.eventmanagement;

import java.time.LocalDate;
import java.util.List;

public record TeacherDashboardResponse(
        LocalDate date,
        String message,
        List<TeacherDashboardLessonResponse> lessons
) {
}
