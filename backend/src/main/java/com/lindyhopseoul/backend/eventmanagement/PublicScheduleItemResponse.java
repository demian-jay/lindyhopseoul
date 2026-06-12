package com.lindyhopseoul.backend.eventmanagement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

public record PublicScheduleItemResponse(
        String id,
        Long eventId,
        Long lessonId,
        EventType eventType,
        LessonType lessonType,
        LocalDate startDate,
        LocalDate endDate,
        LocalTime startTime,
        LocalTime endTime,
        String location,
        BigDecimal fee,
        String currency,
        Map<String, PublicScheduleTextResponse> translations,
        List<LessonTeacherResponse> teachers,
        boolean recommendedForBeginners,
        boolean requiresLevelNotice
) {

    public record PublicScheduleTextResponse(
            String title,
            String eventTitle,
            String shortDescription,
            String description
    ) {
    }
}
