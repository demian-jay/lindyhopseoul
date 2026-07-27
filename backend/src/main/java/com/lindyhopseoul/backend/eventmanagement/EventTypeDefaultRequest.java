package com.lindyhopseoul.backend.eventmanagement;

import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * Far looser than {@link EventRequest} on purpose. This describes what a form
 * opens with, not a published event, so a type may legitimately have no time,
 * no venue and no copy — a party defines none of them. What an admin must still
 * fill in is enforced when the event itself is saved.
 *
 * <p>Times are {@code HH:mm} strings and the fee is a string, matching what the
 * form holds; {@link EventDefaultsService} parses them and reports a bad one as
 * a 400 rather than a 500.
 */
public record EventTypeDefaultRequest(
        @Min(0) @Max(6) Integer weekday,
        @NotNull @PositiveOrZero Integer displayOrder,
        @Size(max = 5) String startTime,
        @Size(max = 5) String endTime,
        @Size(max = 300) String location,
        Boolean addressInfoEnabled,
        @Size(max = 500) String googleMapUrl,
        @Size(max = 500) String naverMapUrl,
        LessonType defaultLessonType,
        Map<String, @Valid EventCopyRequest> translations,
        List<@Valid LessonDefaultRequest> lessons
) {

    public record EventCopyRequest(
            @Size(max = 160) String title,
            @Size(max = 500) String shortDescription,
            String description
    ) {
    }

    public record LessonDefaultRequest(
            @NotNull LessonType lessonType,
            LessonScheduleType scheduleType,
            @Size(max = 5) String startTime,
            @Size(max = 5) String endTime,
            @Size(max = 20) String fee,
            @NotNull @PositiveOrZero Integer displayOrder,
            Boolean roleSelectionEnabled,
            Map<String, @Valid LessonCopyRequest> translations
    ) {
    }

    public record LessonCopyRequest(
            @Size(max = 160) String title,
            String description
    ) {
    }
}
