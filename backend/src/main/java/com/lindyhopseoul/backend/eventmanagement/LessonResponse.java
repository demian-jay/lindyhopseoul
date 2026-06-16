package com.lindyhopseoul.backend.eventmanagement;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public record LessonResponse(
        Long id,
        Long eventId,
        LessonType lessonType,
        LessonScheduleType scheduleType,
        LocalDate startDate,
        LocalDate endDate,
        LocalTime startTime,
        LocalTime endTime,
        BigDecimal fee,
        String currency,
        LessonStatus status,
        Integer displayOrder,
        boolean roleSelectionEnabled,
        Instant createdAt,
        Instant updatedAt,
        Map<String, LessonTranslationResponse> translations,
        List<LessonTeacherResponse> teachers,
        List<EventApplicationResponse> participants
) {

    public static LessonResponse from(Lesson lesson) {
        return from(lesson, List.of());
    }

    public static LessonResponse from(Lesson lesson, List<EventApplicationResponse> participants) {
        return new LessonResponse(
                lesson.getId(),
                lesson.getEvent().getId(),
                lesson.getLessonType(),
                lesson.getScheduleType(),
                lesson.getStartDate(),
                lesson.getEndDate(),
                lesson.getStartTime(),
                lesson.getEndTime(),
                lesson.getFee(),
                lesson.getCurrency(),
                lesson.getStatus(),
                lesson.getDisplayOrder(),
                lesson.isRoleSelectionEnabled(),
                lesson.getCreatedAt(),
                lesson.getUpdatedAt(),
                lesson.getTranslations()
                        .stream()
                        .collect(Collectors.toMap(
                                LessonTranslation::getLanguageCode,
                                translation -> new LessonTranslationResponse(
                                        translation.getTitle(),
                                        translation.getDescription()
                                ),
                                (left, right) -> left,
                                LinkedHashMap::new
                        )),
                lesson.getTeachers()
                        .stream()
                        .sorted(Comparator.comparing(LessonTeacher::getDisplayOrder).thenComparing(LessonTeacher::getId))
                        .map(LessonTeacherResponse::from)
                        .toList(),
                participants
        );
    }

    public record LessonTranslationResponse(
            String title,
            String description
    ) {
    }
}
