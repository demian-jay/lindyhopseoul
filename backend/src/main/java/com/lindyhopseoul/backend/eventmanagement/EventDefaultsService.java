package com.lindyhopseoul.backend.eventmanagement;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.lindyhopseoul.backend.exception.BadRequestException;
import com.lindyhopseoul.backend.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The values the event and lesson registration forms open with. These lived in
 * the frontend as a literal until they became editable; the form still resolves
 * them the same way, it just fetches them now.
 */
@Service
@Transactional(readOnly = true)
public class EventDefaultsService {

    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");
    static final Set<String> SUPPORTED_LANGUAGES = Set.of("ko", "en");

    /**
     * What a lesson falls back to when its event type and lesson type define
     * nothing more specific — a party's lessons, or a level nobody has filled in.
     * Fixed rather than editable: it is the shape of an empty form, not a
     * business value, and every field on it is one the admin fills in anyway.
     */
    private static final LessonDefaultResponse LESSON_FALLBACK = new LessonDefaultResponse(
            null,
            LessonScheduleType.SINGLE_DAY,
            "",
            "",
            "0",
            10,
            false,
            Map.of()
    );

    private final EventTypeDefaultRepository eventTypeDefaultRepository;

    public EventDefaultsService(EventTypeDefaultRepository eventTypeDefaultRepository) {
        this.eventTypeDefaultRepository = eventTypeDefaultRepository;
    }

    public EventDefaultsResponse findAll() {
        List<EventTypeDefaultResponse> eventTypes = eventTypeDefaultRepository.findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(EventTypeDefaultResponse::from)
                .toList();
        return new EventDefaultsResponse(eventTypes, LESSON_FALLBACK);
    }

    @Transactional
    public EventTypeDefaultResponse update(EventType eventType, EventTypeDefaultRequest request) {
        EventTypeDefault target = eventTypeDefaultRepository.findById(eventType)
                .orElseThrow(() -> new ResourceNotFoundException("Event type default not found: " + eventType));

        target.update(
                request.weekday(),
                request.displayOrder(),
                parseTime(request.startTime(), "startTime"),
                parseTime(request.endTime(), "endTime"),
                trimToNull(request.location()),
                request.addressInfoEnabled() == null || request.addressInfoEnabled(),
                trimToNull(request.googleMapUrl()),
                trimToNull(request.naverMapUrl()),
                request.defaultLessonType()
        );

        putEventCopy(target, request.translations());
        putLessonDefaults(target, request.lessons());

        return EventTypeDefaultResponse.from(target);
    }

    private void putEventCopy(EventTypeDefault target, Map<String, EventTypeDefaultRequest.EventCopyRequest> copy) {
        if (copy == null) {
            return;
        }
        copy.forEach((languageCode, text) -> {
            requireSupportedLanguage(languageCode);
            target.putTranslation(
                    languageCode,
                    trimToNull(text.title()),
                    trimToNull(text.shortDescription()),
                    trimToNull(text.description())
            );
        });
    }

    /**
     * Only the lesson types named in the request are touched. Leaving one out
     * keeps whatever it had rather than clearing it, so a screen that edits one
     * lesson at a time does not have to send the rest back.
     */
    private void putLessonDefaults(EventTypeDefault target, List<EventTypeDefaultRequest.LessonDefaultRequest> lessons) {
        if (lessons == null) {
            return;
        }
        for (EventTypeDefaultRequest.LessonDefaultRequest lesson : lessons) {
            LessonTypeDefault lessonDefault = target.lessonDefaultFor(lesson.lessonType());
            lessonDefault.update(
                    lesson.scheduleType(),
                    parseTime(lesson.startTime(), "lesson startTime"),
                    parseTime(lesson.endTime(), "lesson endTime"),
                    parseFee(lesson.fee()),
                    lesson.displayOrder(),
                    Boolean.TRUE.equals(lesson.roleSelectionEnabled())
            );

            if (lesson.translations() == null) {
                continue;
            }
            lesson.translations().forEach((languageCode, text) -> {
                requireSupportedLanguage(languageCode);
                lessonDefault.putTranslation(languageCode, trimToNull(text.title()), trimToNull(text.description()));
            });
        }
    }

    private void requireSupportedLanguage(String languageCode) {
        if (!SUPPORTED_LANGUAGES.contains(languageCode)) {
            throw new BadRequestException("Unsupported language: " + languageCode);
        }
    }

    static String formatTime(LocalTime time) {
        return time == null ? "" : time.format(HH_MM);
    }

    private static LocalTime parseTime(String value, String field) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            return null;
        }
        try {
            return LocalTime.parse(trimmed, HH_MM);
        } catch (DateTimeParseException exception) {
            throw new BadRequestException("Invalid " + field + ": " + value + " (expected HH:mm)");
        }
    }

    private static BigDecimal parseFee(String value) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            return BigDecimal.ZERO;
        }
        try {
            BigDecimal fee = new BigDecimal(trimmed);
            if (fee.signum() < 0) {
                throw new BadRequestException("Fee cannot be negative: " + value);
            }
            return fee;
        } catch (NumberFormatException exception) {
            throw new BadRequestException("Invalid fee: " + value);
        }
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
