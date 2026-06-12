package com.lindyhopseoul.backend.eventmanagement;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PublicScheduleService {

    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    private final EventRepository eventRepository;

    public PublicScheduleService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public List<PublicScheduleItemResponse> findOpenSchedules(LocalDate from, LocalDate to) {
        LocalDate searchFrom = from == null ? LocalDate.now(SEOUL_ZONE) : from;

        return eventRepository.findPublishedDetails(searchFrom, to)
                .stream()
                .flatMap(event -> toPublicItems(event, searchFrom, to).stream())
                .toList();
    }

    private List<PublicScheduleItemResponse> toPublicItems(Event event, LocalDate from, LocalDate to) {
        List<Lesson> publishedLessons = event.getLessons()
                .stream()
                .filter(lesson -> lesson.getStatus() == LessonStatus.PUBLISHED)
                .filter(lesson -> isLessonInWindow(event, lesson, from, to))
                .sorted(Comparator
                        .comparing(Lesson::getDisplayOrder, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(Lesson::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        if (publishedLessons.isEmpty()) {
            return List.of(toEventItem(event));
        }

        return publishedLessons.stream()
                .map(lesson -> toLessonItem(event, lesson))
                .toList();
    }

    private PublicScheduleItemResponse toEventItem(Event event) {
        return new PublicScheduleItemResponse(
                "event-" + event.getId(),
                event.getId(),
                null,
                event.getEventType(),
                null,
                event.getStartDate(),
                event.getEndDate(),
                event.getStartTime(),
                event.getEndTime(),
                event.getLocation(),
                null,
                null,
                eventTranslations(event),
                List.of(),
                false,
                false
        );
    }

    private PublicScheduleItemResponse toLessonItem(Event event, Lesson lesson) {
        return new PublicScheduleItemResponse(
                "lesson-" + lesson.getId(),
                event.getId(),
                lesson.getId(),
                event.getEventType(),
                lesson.getLessonType(),
                effectiveLessonStartDate(event, lesson),
                effectiveLessonEndDate(event, lesson),
                effectiveLessonStartTime(event, lesson),
                effectiveLessonEndTime(event, lesson),
                event.getLocation(),
                lesson.getFee(),
                lesson.getCurrency(),
                lessonTranslations(event, lesson),
                lesson.getTeachers()
                        .stream()
                        .sorted(Comparator.comparing(LessonTeacher::getDisplayOrder).thenComparing(LessonTeacher::getId))
                        .map(LessonTeacherResponse::from)
                        .toList(),
                lesson.getLessonType() == LessonType.LEVEL1,
                requiresLevelNotice(lesson.getLessonType())
        );
    }

    private Map<String, PublicScheduleItemResponse.PublicScheduleTextResponse> eventTranslations(Event event) {
        return EventManagementService.SUPPORTED_LANGUAGES.stream()
                .collect(LinkedHashMap::new, (result, languageCode) -> {
                    EventTranslation eventTranslation = findEventTranslation(event, languageCode);
                    String title = readEventText(eventTranslation, EventTranslation::getTitle);
                    result.put(languageCode, new PublicScheduleItemResponse.PublicScheduleTextResponse(
                            title,
                            title,
                            readEventText(eventTranslation, EventTranslation::getShortDescription),
                            readEventText(eventTranslation, EventTranslation::getDescription)
                    ));
                }, Map::putAll);
    }

    private Map<String, PublicScheduleItemResponse.PublicScheduleTextResponse> lessonTranslations(Event event, Lesson lesson) {
        return EventManagementService.SUPPORTED_LANGUAGES.stream()
                .collect(LinkedHashMap::new, (result, languageCode) -> {
                    EventTranslation eventTranslation = findEventTranslation(event, languageCode);
                    LessonTranslation lessonTranslation = findLessonTranslation(lesson, languageCode);
                    result.put(languageCode, new PublicScheduleItemResponse.PublicScheduleTextResponse(
                            readLessonText(lessonTranslation, LessonTranslation::getTitle),
                            readEventText(eventTranslation, EventTranslation::getTitle),
                            readEventText(eventTranslation, EventTranslation::getShortDescription),
                            readLessonText(lessonTranslation, LessonTranslation::getDescription)
                    ));
                }, Map::putAll);
    }

    private EventTranslation findEventTranslation(Event event, String languageCode) {
        return event.getTranslations()
                .stream()
                .filter(translation -> translation.getLanguageCode().equals(languageCode))
                .findFirst()
                .or(() -> event.getTranslations()
                        .stream()
                        .filter(translation -> translation.getLanguageCode().equals(EventManagementService.DEFAULT_LANGUAGE))
                        .findFirst())
                .orElse(null);
    }

    private LessonTranslation findLessonTranslation(Lesson lesson, String languageCode) {
        return lesson.getTranslations()
                .stream()
                .filter(translation -> translation.getLanguageCode().equals(languageCode))
                .findFirst()
                .or(() -> lesson.getTranslations()
                        .stream()
                        .filter(translation -> translation.getLanguageCode().equals(EventManagementService.DEFAULT_LANGUAGE))
                        .findFirst())
                .orElse(null);
    }

    private boolean requiresLevelNotice(LessonType lessonType) {
        return lessonType == LessonType.LEVEL2
                || lessonType == LessonType.LEVEL3
                || lessonType == LessonType.LEVEL4
                || lessonType == LessonType.WORKSHOP;
    }

    private boolean isLessonInWindow(Event event, Lesson lesson, LocalDate from, LocalDate to) {
        LocalDate endDate = effectiveLessonEndDate(event, lesson);
        LocalDate startDate = effectiveLessonStartDate(event, lesson);

        if (endDate == null || startDate == null) {
            return false;
        }

        return !endDate.isBefore(from) && (to == null || !startDate.isAfter(to));
    }

    private LocalDate effectiveLessonStartDate(Event event, Lesson lesson) {
        return lesson.getStartDate() == null ? event.getStartDate() : lesson.getStartDate();
    }

    private LocalDate effectiveLessonEndDate(Event event, Lesson lesson) {
        return lesson.getEndDate() == null ? event.getEndDate() : lesson.getEndDate();
    }

    private java.time.LocalTime effectiveLessonStartTime(Event event, Lesson lesson) {
        return lesson.getStartTime() == null ? event.getStartTime() : lesson.getStartTime();
    }

    private java.time.LocalTime effectiveLessonEndTime(Event event, Lesson lesson) {
        return lesson.getEndTime() == null ? event.getEndTime() : lesson.getEndTime();
    }

    private String readEventText(EventTranslation translation, Function<EventTranslation, String> reader) {
        return translation == null ? "" : reader.apply(translation);
    }

    private String readLessonText(LessonTranslation translation, Function<LessonTranslation, String> reader) {
        return translation == null ? "" : reader.apply(translation);
    }
}
