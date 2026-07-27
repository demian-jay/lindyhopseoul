package com.lindyhopseoul.backend.eventmanagement;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The fee is a plain string rather than a number because the form's input is
 * one, and because a lesson fee is whole won — sending {@code 60000.00} would
 * put it in the box that way.
 */
public record LessonDefaultResponse(
        LessonType lessonType,
        LessonScheduleType scheduleType,
        String startTime,
        String endTime,
        String fee,
        Integer displayOrder,
        boolean roleSelectionEnabled,
        Map<String, LessonCopyResponse> translations
) {

    public static LessonDefaultResponse from(LessonTypeDefault source) {
        Map<String, LessonCopyResponse> translations = new LinkedHashMap<>();
        source.getTranslations().forEach(translation -> translations.put(
                translation.getLanguageCode(),
                new LessonCopyResponse(
                        nullToEmpty(translation.getTitle()),
                        nullToEmpty(translation.getDescription())
                )
        ));

        return new LessonDefaultResponse(
                source.getLessonType(),
                source.getScheduleType(),
                EventDefaultsService.formatTime(source.getStartTime()),
                EventDefaultsService.formatTime(source.getEndTime()),
                formatFee(source.getFee()),
                source.getDisplayOrder(),
                source.isRoleSelectionEnabled(),
                translations
        );
    }

    static String formatFee(BigDecimal fee) {
        return fee == null ? "0" : fee.stripTrailingZeros().toPlainString();
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    public record LessonCopyResponse(String title, String description) {
    }
}
