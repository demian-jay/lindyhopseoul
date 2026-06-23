package com.lindyhopseoul.backend.eventmanagement;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.function.Function;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MemberClassApplicationService {

    private static final String APPLIED_STATUS = "APPLIED";

    private final EventApplicationRepository eventApplicationRepository;

    public MemberClassApplicationService(EventApplicationRepository eventApplicationRepository) {
        this.eventApplicationRepository = eventApplicationRepository;
    }

    public List<MemberClassApplicationResponse> findMyApplications(Long memberId, String languageCode) {
        String normalizedLanguageCode = normalizeLanguageCode(languageCode);
        return eventApplicationRepository.findByMember_IdOrderByCreatedAtDescIdDesc(memberId)
                .stream()
                .map(application -> toResponse(application, normalizedLanguageCode))
                .toList();
    }

    public List<Long> findAppliedClassIds(Long memberId) {
        return eventApplicationRepository.findByMember_IdOrderByCreatedAtDescIdDesc(memberId)
                .stream()
                .map(this::classId)
                .distinct()
                .toList();
    }

    public List<String> findAppliedScheduleItemIds(Long memberId) {
        return eventApplicationRepository.findByMember_IdOrderByCreatedAtDescIdDesc(memberId)
                .stream()
                .map(this::scheduleItemId)
                .distinct()
                .toList();
    }

    private MemberClassApplicationResponse toResponse(EventApplication application, String languageCode) {
        Lesson lesson = application.getLesson();
        Event event = application.getEvent();
        return new MemberClassApplicationResponse(
                application.getId(),
                lesson == null ? event.getId() : lesson.getId(),
                scheduleItemId(application),
                title(event, lesson, languageCode),
                classDate(event, lesson),
                application.getDanceRole(),
                APPLIED_STATUS,
                application.getCreatedAt()
        );
    }

    private Long classId(EventApplication application) {
        Lesson lesson = application.getLesson();
        return lesson == null ? application.getEvent().getId() : lesson.getId();
    }

    private String scheduleItemId(EventApplication application) {
        Lesson lesson = application.getLesson();
        if (lesson == null) {
            return "event-" + application.getEvent().getId();
        }
        return "lesson-" + lesson.getId();
    }

    private LocalDate classDate(Event event, Lesson lesson) {
        if (lesson == null || lesson.getStartDate() == null) {
            return event.getStartDate();
        }
        return lesson.getStartDate();
    }

    private String title(Event event, Lesson lesson, String languageCode) {
        if (lesson != null) {
            String lessonTitle = translatedLessonTitle(lesson, languageCode);
            if (!lessonTitle.isBlank()) {
                return lessonTitle;
            }
        }

        String eventTitle = translatedEventTitle(event, languageCode);
        if (!eventTitle.isBlank()) {
            return eventTitle;
        }

        return lesson == null ? "Event #" + event.getId() : "Class #" + lesson.getId();
    }

    private String translatedLessonTitle(Lesson lesson, String languageCode) {
        return readTranslation(
                lesson.getTranslations()
                        .stream()
                        .sorted(Comparator.comparing(LessonTranslation::getLanguageCode)),
                LessonTranslation::getLanguageCode,
                LessonTranslation::getTitle,
                languageCode
        );
    }

    private String translatedEventTitle(Event event, String languageCode) {
        return readTranslation(
                event.getTranslations()
                        .stream()
                        .sorted(Comparator.comparing(EventTranslation::getLanguageCode)),
                EventTranslation::getLanguageCode,
                EventTranslation::getTitle,
                languageCode
        );
    }

    private <T> String readTranslation(
            java.util.stream.Stream<T> translations,
            Function<T, String> languageReader,
            Function<T, String> titleReader,
            String languageCode
    ) {
        List<T> translationList = translations.toList();
        return translationList.stream()
                .filter(translation -> languageReader.apply(translation).equals(languageCode))
                .findFirst()
                .or(() -> translationList.stream()
                        .filter(translation -> languageReader.apply(translation).equals(EventManagementService.DEFAULT_LANGUAGE))
                        .findFirst())
                .or(() -> translationList.stream().findFirst())
                .map(titleReader)
                .map(String::trim)
                .orElse("");
    }

    private String normalizeLanguageCode(String languageCode) {
        String normalized = languageCode == null ? "" : languageCode.trim().toLowerCase();
        return EventManagementService.SUPPORTED_LANGUAGES.contains(normalized)
                ? normalized
                : EventManagementService.DEFAULT_LANGUAGE;
    }
}
