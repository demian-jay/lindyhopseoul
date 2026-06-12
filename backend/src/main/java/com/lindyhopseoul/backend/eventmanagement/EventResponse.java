package com.lindyhopseoul.backend.eventmanagement;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public record EventResponse(
        Long id,
        EventType eventType,
        LocalDate startDate,
        LocalDate endDate,
        LocalTime startTime,
        LocalTime endTime,
        String location,
        EventStatus status,
        Integer displayOrder,
        Instant createdAt,
        Instant updatedAt,
        Map<String, EventTranslationResponse> translations,
        List<LessonResponse> lessons
) {

    public static EventResponse summaryFrom(Event event) {
        return from(event, List.of());
    }

    public static EventResponse from(Event event) {
        return from(event, Map.of());
    }

    public static EventResponse from(
            Event event,
            Map<Long, List<EventApplicationResponse>> participantsByLessonId
    ) {
        return from(
                event,
                sortedLessons(event.getLessons())
                        .sorted(Comparator.comparing(Lesson::getDisplayOrder).thenComparing(Lesson::getId))
                        .map(lesson -> LessonResponse.from(
                                lesson,
                                participantsByLessonId.getOrDefault(lesson.getId(), List.of())
                        ))
                        .toList()
        );
    }

    private static java.util.stream.Stream<Lesson> sortedLessons(Collection<Lesson> lessons) {
        return lessons.stream();
    }

    private static EventResponse from(Event event, List<LessonResponse> lessons) {
        return new EventResponse(
                event.getId(),
                event.getEventType(),
                event.getStartDate(),
                event.getEndDate(),
                event.getStartTime(),
                event.getEndTime(),
                event.getLocation(),
                event.getStatus(),
                event.getDisplayOrder(),
                event.getCreatedAt(),
                event.getUpdatedAt(),
                event.getTranslations()
                        .stream()
                        .collect(Collectors.toMap(
                                EventTranslation::getLanguageCode,
                                translation -> new EventTranslationResponse(
                                        translation.getTitle(),
                                        translation.getShortDescription(),
                                        translation.getDescription()
                                ),
                                (left, right) -> left,
                                LinkedHashMap::new
                        )),
                lessons
        );
    }

    public record EventTranslationResponse(
            String title,
            String shortDescription,
            String description
    ) {
    }
}
