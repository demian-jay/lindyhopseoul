package com.lindyhopseoul.backend.eventmanagement;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

/**
 * A lesson as the 강습조회 screen needs it: enough to label the row
 * "lesson - event" in either language, and the participants and teachers behind
 * it. Deliberately not {@link LessonResponse} — that record is reached through
 * queries that do not fetch the event's translations, so it cannot carry the
 * event title without risking a lazy load outside its transaction.
 */
public record AdminLessonBoardResponse(
        Long lessonId,
        Long eventId,
        Map<String, String> lessonTitles,
        Map<String, String> eventTitles,
        EventType eventType,
        LessonType lessonType,
        LessonStatus status,
        LocalDate startDate,
        LocalDate endDate,
        LocalTime startTime,
        LocalTime endTime,
        List<LessonTeacherResponse> teachers,
        List<EventApplicationResponse> participants
) {
}
