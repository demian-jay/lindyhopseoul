package com.lindyhopseoul.backend.eventmanagement;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

public record TeacherDashboardLessonResponse(
        Long eventId,
        EventType eventType,
        Map<String, String> eventTitle,
        Long lessonId,
        LessonType lessonType,
        LessonScheduleType scheduleType,
        LessonStatus status,
        Map<String, String> lessonTitle,
        LocalDate startDate,
        LocalDate endDate,
        LocalTime startTime,
        LocalTime endTime,
        LessonDisplayStatus lessonDisplayStatus,
        List<TeacherDashboardTeacherResponse> teachers,
        List<Object> participants
) {

    public record TeacherDashboardTeacherResponse(
            String id,
            String name
    ) {
    }
}
