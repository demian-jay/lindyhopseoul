package com.lindyhopseoul.backend.eventmanagement;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Times are strings in {@code HH:mm} and translations are keyed by language
 * code, so this lands in the form's state shape without conversion. Null times
 * become empty strings for the same reason — the inputs are controlled.
 */
public record EventTypeDefaultResponse(
        EventType eventType,
        Integer weekday,
        Integer displayOrder,
        String startTime,
        String endTime,
        String location,
        boolean addressInfoEnabled,
        String googleMapUrl,
        String naverMapUrl,
        LessonType defaultLessonType,
        Map<String, EventCopyResponse> translations,
        List<LessonDefaultResponse> lessons
) {

    public static EventTypeDefaultResponse from(EventTypeDefault source) {
        Map<String, EventCopyResponse> translations = new LinkedHashMap<>();
        source.getTranslations().forEach(translation -> translations.put(
                translation.getLanguageCode(),
                new EventCopyResponse(
                        nullToEmpty(translation.getTitle()),
                        nullToEmpty(translation.getShortDescription()),
                        nullToEmpty(translation.getDescription())
                )
        ));

        List<LessonDefaultResponse> lessons = source.getLessonDefaults().stream()
                .sorted(Comparator.comparing(LessonTypeDefault::getLessonType))
                .map(LessonDefaultResponse::from)
                .toList();

        return new EventTypeDefaultResponse(
                source.getEventType(),
                source.getWeekday(),
                source.getDisplayOrder(),
                EventDefaultsService.formatTime(source.getStartTime()),
                EventDefaultsService.formatTime(source.getEndTime()),
                nullToEmpty(source.getLocation()),
                source.isAddressInfoEnabled(),
                nullToEmpty(source.getGoogleMapUrl()),
                nullToEmpty(source.getNaverMapUrl()),
                source.getDefaultLessonType(),
                translations,
                lessons
        );
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    public record EventCopyResponse(String title, String shortDescription, String description) {
    }
}
