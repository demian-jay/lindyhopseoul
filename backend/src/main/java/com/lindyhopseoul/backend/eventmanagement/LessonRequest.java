package com.lindyhopseoul.backend.eventmanagement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record LessonRequest(
        @NotNull LessonType lessonType,
        @NotNull LessonScheduleType scheduleType,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @NotNull @DecimalMin("0.0") BigDecimal fee,
        @NotBlank @Size(max = 10) String currency,
        @NotNull LessonStatus status,
        @NotNull Integer displayOrder,
        List<String> teacherUserIds,
        @NotNull Map<String, @Valid LessonTranslationRequest> translations
) {

    public record LessonTranslationRequest(
            @NotBlank @Size(max = 160) String title,
            @NotBlank String description
    ) {
    }
}
