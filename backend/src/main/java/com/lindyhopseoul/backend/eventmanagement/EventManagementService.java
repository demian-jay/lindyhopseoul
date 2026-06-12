package com.lindyhopseoul.backend.eventmanagement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import com.lindyhopseoul.backend.admin.AdminLanguage;
import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminRole;
import com.lindyhopseoul.backend.admin.TeacherUser;
import com.lindyhopseoul.backend.admin.TeacherUserRepository;
import com.lindyhopseoul.backend.exception.ConflictException;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import com.lindyhopseoul.backend.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class EventManagementService {

    public static final String DEFAULT_LANGUAGE = "ko";
    public static final List<String> SUPPORTED_LANGUAGES = List.of("ko", "en");

    private static final Pattern TEMPLATE_VARIABLE_PATTERN = Pattern.compile("\\{\\{\\s*([a-zA-Z0-9_.]+)\\s*}}");
    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    private final EventRepository eventRepository;
    private final LessonRepository lessonRepository;
    private final MessageTemplateRepository messageTemplateRepository;
    private final TeacherUserRepository teacherUserRepository;
    private final EventApplicationRepository eventApplicationRepository;

    public EventManagementService(
            EventRepository eventRepository,
            LessonRepository lessonRepository,
            MessageTemplateRepository messageTemplateRepository,
            TeacherUserRepository teacherUserRepository,
            EventApplicationRepository eventApplicationRepository
    ) {
        this.eventRepository = eventRepository;
        this.lessonRepository = lessonRepository;
        this.messageTemplateRepository = messageTemplateRepository;
        this.teacherUserRepository = teacherUserRepository;
        this.eventApplicationRepository = eventApplicationRepository;
    }

    public List<EventResponse> findEvents(
            AdminPrincipal actor,
            LocalDate from,
            LocalDate to,
            EventType eventType,
            EventStatus status
    ) {
        requireEventReader(actor);
        return eventRepository.search(from, to, eventType, status)
                .stream()
                .map(EventResponse::summaryFrom)
                .toList();
    }

    public EventResponse findEvent(AdminPrincipal actor, Long eventId) {
        requireEventReader(actor);
        Event event = findEventDetails(eventId);
        return EventResponse.from(event, participantsByLessonId(event.getLessons()));
    }

    @Transactional
    public EventResponse createEvent(AdminPrincipal actor, EventRequest request) {
        requireEventEditor(actor);
        validateDateRange(request.startDate(), request.endDate(), "Event");
        Event event = Event.create(
                request.eventType(),
                request.startDate(),
                request.endDate(),
                request.startTime(),
                request.endTime(),
                clean(request.location()),
                request.status(),
                request.displayOrder()
        );
        event.replaceTranslations(toEventTranslations(request.translations()));
        eventRepository.save(event);
        return EventResponse.from(event);
    }

    @Transactional
    public EventResponse updateEvent(AdminPrincipal actor, Long eventId, EventRequest request) {
        requireEventEditor(actor);
        validateDateRange(request.startDate(), request.endDate(), "Event");
        Event event = findEventDetails(eventId);
        event.update(
                request.eventType(),
                request.startDate(),
                request.endDate(),
                request.startTime(),
                request.endTime(),
                clean(request.location()),
                request.status(),
                request.displayOrder()
        );
        event.replaceTranslations(toEventTranslations(request.translations()));
        return EventResponse.from(event);
    }

    @Transactional
    public void deleteEvent(AdminPrincipal actor, Long eventId) {
        requireEventDeleter(actor);
        eventRepository.delete(findEventEntity(eventId));
    }

    public List<LessonResponse> findLessons(AdminPrincipal actor, Long eventId) {
        requireEventReader(actor);
        if (!eventRepository.existsById(eventId)) {
            throw new ResourceNotFoundException("Event not found: " + eventId);
        }
        List<Lesson> lessons = lessonRepository.findByEventIdWithDetails(eventId);
        Map<Long, List<EventApplicationResponse>> participantsByLessonId = participantsByLessonId(lessons);
        return lessons.stream()
                .map(lesson -> LessonResponse.from(
                        lesson,
                        participantsByLessonId.getOrDefault(lesson.getId(), List.of())
                ))
                .toList();
    }

    @Transactional
    public LessonResponse createLesson(AdminPrincipal actor, Long eventId, LessonRequest request) {
        requireEventEditor(actor);
        Event event = findEventEntity(eventId);
        LessonDateRange lessonDateRange = normalizeLessonDates(request.scheduleType(), request.startDate(), request.endDate());
        Lesson lesson = Lesson.create(
                event,
                request.lessonType(),
                request.scheduleType(),
                lessonDateRange.startDate(),
                lessonDateRange.endDate(),
                request.startTime(),
                request.endTime(),
                request.fee(),
                clean(request.currency()).toUpperCase(),
                request.status(),
                request.displayOrder()
        );
        lesson.replaceTranslations(toLessonTranslations(request.translations()));
        lesson.replaceTeachers(toLessonTeachers(request.teacherUserIds()));
        lessonRepository.save(lesson);
        return LessonResponse.from(lesson);
    }

    @Transactional
    public LessonResponse updateLesson(AdminPrincipal actor, Long lessonId, LessonRequest request) {
        requireEventEditor(actor);
        Lesson lesson = findLessonDetails(lessonId);
        LessonDateRange lessonDateRange = normalizeLessonDates(request.scheduleType(), request.startDate(), request.endDate());
        lesson.update(
                request.lessonType(),
                request.scheduleType(),
                lessonDateRange.startDate(),
                lessonDateRange.endDate(),
                request.startTime(),
                request.endTime(),
                request.fee(),
                clean(request.currency()).toUpperCase(),
                request.status(),
                request.displayOrder()
        );
        lesson.replaceTranslations(toLessonTranslations(request.translations()));
        lesson.replaceTeachers(toLessonTeachers(request.teacherUserIds()));
        return LessonResponse.from(lesson);
    }

    @Transactional
    public void deleteLesson(AdminPrincipal actor, Long lessonId) {
        requireEventDeleter(actor);
        lessonRepository.delete(findLessonEntity(lessonId));
    }

    public List<ActiveTeacherResponse> findActiveTeachers(AdminPrincipal actor) {
        requireEventReader(actor);
        return teacherUserRepository.findActiveTeacherRoleProfiles()
                .stream()
                .map(ActiveTeacherResponse::from)
                .toList();
    }

    public List<MessageTemplateResponse> findMessageTemplates(AdminPrincipal actor) {
        requirePromotionRenderer(actor);
        return messageTemplateRepository.findAllByOrderByUpdatedAtDescIdDesc()
                .stream()
                .map(MessageTemplateResponse::from)
                .toList();
    }

    public MessageTemplateResponse findMessageTemplate(AdminPrincipal actor, Long templateId) {
        requirePromotionRenderer(actor);
        return MessageTemplateResponse.from(findTemplate(templateId));
    }

    @Transactional
    public MessageTemplateResponse createMessageTemplate(AdminPrincipal actor, MessageTemplateRequest request) {
        requireTemplateManager(actor);
        MessageTemplate template = MessageTemplate.create(
                clean(request.templateName()),
                request.templateType(),
                clean(request.content()),
                request.useYn()
        );
        messageTemplateRepository.save(template);
        return MessageTemplateResponse.from(template);
    }

    @Transactional
    public MessageTemplateResponse updateMessageTemplate(
            AdminPrincipal actor,
            Long templateId,
            MessageTemplateRequest request
    ) {
        requireTemplateManager(actor);
        MessageTemplate template = findTemplate(templateId);
        template.update(clean(request.templateName()), request.templateType(), clean(request.content()), request.useYn());
        return MessageTemplateResponse.from(template);
    }

    @Transactional
    public void deleteMessageTemplate(AdminPrincipal actor, Long templateId) {
        requireTemplateManager(actor);
        messageTemplateRepository.delete(findTemplate(templateId));
    }

    public MessageRenderResponse renderMessageTemplate(
            AdminPrincipal actor,
            Long templateId,
            MessageRenderRequest request
    ) {
        requirePromotionRenderer(actor);
        MessageTemplate template = findTemplate(templateId);
        Event event = findEventDetails(request.eventId());
        String languageCode = normalizeLanguage(request.languageCode());
        String renderedText = render(template.getContent(), buildTemplateVariables(event));
        return new MessageRenderResponse(template.getId(), event.getId(), languageCode, renderedText);
    }

    public TeacherDashboardResponse findTeacherDashboard(AdminPrincipal actor) {
        LocalDate today = LocalDate.now(SEOUL_ZONE);
        requireTeacher(actor);
        Optional<TeacherUser> teacherUser = teacherUserRepository
                .findFirstByUserAccount_UserIdAndUseYnOrderByTeacherUserNmAsc(actor.userCd(), "Y");
        if (teacherUser.isEmpty()) {
            return new TeacherDashboardResponse(today, "등록된 강사 정보가 없습니다.", List.of());
        }
        List<Lesson> lessons = lessonRepository.findActiveTeacherLessons(teacherUser.get().getTeacherUserCd(), today);
        Map<Long, List<EventApplicationResponse>> participantsByLessonId = participantsByLessonId(lessons);
        return new TeacherDashboardResponse(
                today,
                null,
                lessons.stream()
                        .map(lesson -> toTeacherDashboardLessonResponse(lesson, today, participantsByLessonId))
                        .filter(lesson -> lesson.lessonDisplayStatus() != LessonDisplayStatus.ENDED)
                        .toList()
        );
    }

    public List<TeacherDashboardLessonResponse> findTeacherLessons(AdminPrincipal actor, LocalDate from, LocalDate to) {
        return findTeacherLessons(actor, from, to, LessonStatus.PUBLISHED);
    }

    public List<TeacherDashboardLessonResponse> findTeacherLessons(
            AdminPrincipal actor,
            LocalDate from,
            LocalDate to,
            LessonStatus status
    ) {
        requireTeacher(actor);
        LocalDate today = LocalDate.now(SEOUL_ZONE);
        Optional<TeacherUser> teacherUser = teacherUserRepository
                .findFirstByUserAccount_UserIdAndUseYnOrderByTeacherUserNmAsc(actor.userCd(), "Y");
        if (teacherUser.isEmpty()) {
            return List.of();
        }
        LessonStatus requestedStatus = status == null ? LessonStatus.PUBLISHED : status;
        List<Lesson> lessons = lessonRepository.findTeacherLessons(teacherUser.get().getTeacherUserCd(), from, to, requestedStatus);
        Map<Long, List<EventApplicationResponse>> participantsByLessonId = participantsByLessonId(lessons);
        return lessons.stream()
                .map(lesson -> toTeacherDashboardLessonResponse(lesson, today, participantsByLessonId))
                .toList();
    }

    private TeacherDashboardLessonResponse toTeacherDashboardLessonResponse(
            Lesson lesson,
            LocalDate today,
            Map<Long, List<EventApplicationResponse>> participantsByLessonId
    ) {
        Event event = lesson.getEvent();
        return new TeacherDashboardLessonResponse(
                event.getId(),
                event.getEventType(),
                eventTitleMap(event),
                lesson.getId(),
                lesson.getLessonType(),
                lesson.getScheduleType(),
                lesson.getStatus(),
                lessonTitleMap(lesson),
                lesson.getStartDate(),
                lesson.getEndDate(),
                lesson.getStartTime(),
                lesson.getEndTime(),
                calculateDisplayStatus(lesson, today),
                lesson.getTeachers()
                        .stream()
                        .sorted(Comparator.comparing(LessonTeacher::getDisplayOrder).thenComparing(LessonTeacher::getId))
                        .map(lessonTeacher -> new TeacherDashboardLessonResponse.TeacherDashboardTeacherResponse(
                                lessonTeacher.getTeacherUser().getTeacherUserCd(),
                                lessonTeacher.getTeacherUser().getTeacherUserNm()
                        ))
                        .toList(),
                participantsByLessonId.getOrDefault(lesson.getId(), List.of())
        );
    }

    private Map<Long, List<EventApplicationResponse>> participantsByLessonId(Collection<Lesson> lessons) {
        List<Long> lessonIds = lessons.stream()
                .map(Lesson::getId)
                .filter(Objects::nonNull)
                .toList();
        if (lessonIds.isEmpty()) {
            return Map.of();
        }
        return eventApplicationRepository.findByLesson_IdInOrderByCreatedAtAscIdAsc(lessonIds)
                .stream()
                .collect(Collectors.groupingBy(
                        application -> application.getLesson().getId(),
                        LinkedHashMap::new,
                        Collectors.mapping(EventApplicationResponse::from, Collectors.toList())
                ));
    }

    private Map<String, String> buildTemplateVariables(Event event) {
        Map<String, String> variables = new LinkedHashMap<>();
        variables.put("event.title.ko", findEventText(event, "ko", EventTranslation::getTitle));
        variables.put("event.title.en", findEventText(event, "en", EventTranslation::getTitle));
        variables.put("event.shortDescription.ko", findEventText(event, "ko", EventTranslation::getShortDescription));
        variables.put("event.shortDescription.en", findEventText(event, "en", EventTranslation::getShortDescription));
        variables.put("event.description.ko", findEventText(event, "ko", EventTranslation::getDescription));
        variables.put("event.description.en", findEventText(event, "en", EventTranslation::getDescription));
        variables.put("event.date", formatEventDateRange(event));
        variables.put("event.startDate", event.getStartDate().toString());
        variables.put("event.endDate", event.getEndDate().toString());
        variables.put("event.startTime", formatTime(event.getStartTime()));
        variables.put("event.endTime", formatTime(event.getEndTime()));
        variables.put("event.location", event.getLocation());
        variables.put("lessons.all.ko", formatLessons(event.getLessons(), "ko"));
        variables.put("lessons.all.en", formatLessons(event.getLessons(), "en"));

        for (LessonType lessonType : LessonType.values()) {
            String key = toTemplateLessonTypeKey(lessonType);
            List<Lesson> lessons = event.getLessons()
                    .stream()
                    .filter(lesson -> lesson.getLessonType() == lessonType)
                    .sorted(Comparator.comparing(Lesson::getDisplayOrder).thenComparing(Lesson::getId))
                    .toList();
            variables.put("lessons." + key + ".title.ko", joinLessonValues(lessons, lesson -> findLessonText(lesson, "ko", LessonTranslation::getTitle)));
            variables.put("lessons." + key + ".title.en", joinLessonValues(lessons, lesson -> findLessonText(lesson, "en", LessonTranslation::getTitle)));
            variables.put("lessons." + key + ".time", joinLessonValues(lessons, this::formatLessonTime));
            variables.put("lessons." + key + ".fee", joinLessonValues(lessons, this::formatLessonFee));
            variables.put("lessons." + key + ".teachers", joinLessonValues(lessons, this::formatLessonTeachers));
        }

        return variables;
    }

    private String render(String content, Map<String, String> variables) {
        Matcher matcher = TEMPLATE_VARIABLE_PATTERN.matcher(content);
        StringBuffer rendered = new StringBuffer();
        while (matcher.find()) {
            matcher.appendReplacement(rendered, Matcher.quoteReplacement(variables.getOrDefault(matcher.group(1), "")));
        }
        matcher.appendTail(rendered);
        return rendered.toString();
    }

    private String formatLessons(Set<Lesson> lessons, String languageCode) {
        return lessons.stream()
                .sorted(Comparator.comparing(Lesson::getDisplayOrder).thenComparing(Lesson::getId))
                .map(lesson -> String.join(" / ",
                        findLessonText(lesson, languageCode, LessonTranslation::getTitle),
                        formatLessonTime(lesson),
                        formatLessonFee(lesson),
                        formatLessonTeachers(lesson)
                ))
                .collect(Collectors.joining("\n"));
    }

    private String joinLessonValues(List<Lesson> lessons, Function<Lesson, String> formatter) {
        return lessons.stream()
                .map(formatter)
                .filter(value -> value != null && !value.isBlank())
                .collect(Collectors.joining("\n"));
    }

    private String findEventText(Event event, String languageCode, Function<EventTranslation, String> reader) {
        return event.getTranslations()
                .stream()
                .filter(translation -> translation.getLanguageCode().equals(languageCode))
                .findFirst()
                .or(() -> event.getTranslations()
                        .stream()
                        .filter(translation -> translation.getLanguageCode().equals(DEFAULT_LANGUAGE))
                        .findFirst())
                .map(reader)
                .orElse("");
    }

    private String findLessonText(Lesson lesson, String languageCode, Function<LessonTranslation, String> reader) {
        return lesson.getTranslations()
                .stream()
                .filter(translation -> translation.getLanguageCode().equals(languageCode))
                .findFirst()
                .or(() -> lesson.getTranslations()
                        .stream()
                        .filter(translation -> translation.getLanguageCode().equals(DEFAULT_LANGUAGE))
                        .findFirst())
                .map(reader)
                .orElse("");
    }

    private String formatLessonTime(Lesson lesson) {
        return formatTime(lesson.getStartTime()) + "-" + formatTime(lesson.getEndTime());
    }

    private String formatEventDateRange(Event event) {
        if (event.getStartDate().equals(event.getEndDate())) {
            return event.getStartDate().toString();
        }
        return event.getStartDate() + "-" + event.getEndDate();
    }

    private String formatTime(LocalTime time) {
        return time == null ? "" : time.toString();
    }

    private String formatLessonFee(Lesson lesson) {
        return formatAmount(lesson.getFee()) + " " + lesson.getCurrency();
    }

    private String formatAmount(BigDecimal amount) {
        return Optional.ofNullable(amount)
                .map(value -> value.stripTrailingZeros().toPlainString())
                .orElse("0");
    }

    private String formatLessonTeachers(Lesson lesson) {
        return lesson.getTeachers()
                .stream()
                .sorted(Comparator.comparing(LessonTeacher::getDisplayOrder).thenComparing(LessonTeacher::getId))
                .map(lessonTeacher -> lessonTeacher.getTeacherUser().getTeacherUserNm())
                .collect(Collectors.joining(", "));
    }

    private String toTemplateLessonTypeKey(LessonType lessonType) {
        return switch (lessonType) {
            case LEVEL1 -> "level1";
            case LEVEL2 -> "level2";
            case LEVEL3 -> "level3";
            case LEVEL4 -> "level4";
            case WORKSHOP -> "workshop";
            case EXPERIENCE -> "experience";
        };
    }

    private Map<String, String> eventTitleMap(Event event) {
        return SUPPORTED_LANGUAGES.stream()
                .collect(Collectors.toMap(
                        Function.identity(),
                        languageCode -> findEventText(event, languageCode, EventTranslation::getTitle),
                        (left, right) -> left,
                        LinkedHashMap::new
                ));
    }

    private Map<String, String> lessonTitleMap(Lesson lesson) {
        return SUPPORTED_LANGUAGES.stream()
                .collect(Collectors.toMap(
                        Function.identity(),
                        languageCode -> findLessonText(lesson, languageCode, LessonTranslation::getTitle),
                        (left, right) -> left,
                        LinkedHashMap::new
                ));
    }

    private LessonDisplayStatus calculateDisplayStatus(Lesson lesson, LocalDate today) {
        if (today.isBefore(lesson.getStartDate())) {
            return LessonDisplayStatus.UPCOMING;
        }
        if (!today.isAfter(lesson.getEndDate())) {
            return LessonDisplayStatus.ACTIVE;
        }
        return LessonDisplayStatus.ENDED;
    }

    private Set<EventTranslation> toEventTranslations(Map<String, EventRequest.EventTranslationRequest> translations) {
        requireDefaultLanguage(translations);
        return translations.entrySet()
                .stream()
                .filter(entry -> SUPPORTED_LANGUAGES.contains(entry.getKey()))
                .map(entry -> new EventTranslation(
                        entry.getKey(),
                        clean(entry.getValue().title()),
                        clean(entry.getValue().shortDescription()),
                        clean(entry.getValue().description())
                ))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private Set<LessonTranslation> toLessonTranslations(Map<String, LessonRequest.LessonTranslationRequest> translations) {
        requireDefaultLanguage(translations);
        return translations.entrySet()
                .stream()
                .filter(entry -> SUPPORTED_LANGUAGES.contains(entry.getKey()))
                .map(entry -> new LessonTranslation(
                        entry.getKey(),
                        clean(entry.getValue().title()),
                        clean(entry.getValue().description())
                ))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private Set<LessonTeacher> toLessonTeachers(List<String> teacherUserIds) {
        if (teacherUserIds == null || teacherUserIds.isEmpty()) {
            return new LinkedHashSet<>();
        }

        List<String> uniqueTeacherIds = teacherUserIds.stream()
                .map(this::cleanNullable)
                .filter(value -> value != null && !value.isBlank())
                .distinct()
                .toList();
        Map<String, TeacherUser> teachersById = teacherUserRepository.findAllById(uniqueTeacherIds)
                .stream()
                .collect(Collectors.toMap(TeacherUser::getTeacherUserCd, Function.identity()));

        Set<LessonTeacher> lessonTeachers = new LinkedHashSet<>();
        int displayOrder = 10;
        for (String teacherUserId : uniqueTeacherIds) {
            TeacherUser teacherUser = teachersById.get(teacherUserId);
            if (teacherUser == null || !teacherUser.isActive()) {
                throw new ConflictException("Lesson teachers must exist and be active: " + teacherUserId);
            }
            lessonTeachers.add(new LessonTeacher(teacherUser, "TEACHER", displayOrder));
            displayOrder += 10;
        }
        return lessonTeachers;
    }

    private void requireDefaultLanguage(Map<String, ?> translations) {
        if (translations == null || !translations.containsKey(DEFAULT_LANGUAGE) || translations.get(DEFAULT_LANGUAGE) == null) {
            throw new ConflictException("Default language translation is required.");
        }
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate, String targetName) {
        if (startDate == null || endDate == null) {
            throw new ConflictException(targetName + " start date and end date are required.");
        }
        if (endDate.isBefore(startDate)) {
            throw new ConflictException(targetName + " end date cannot be before start date.");
        }
    }

    private LessonDateRange normalizeLessonDates(
            LessonScheduleType scheduleType,
            LocalDate startDate,
            LocalDate endDate
    ) {
        if (scheduleType == LessonScheduleType.SINGLE_DAY) {
            validateDateRange(startDate, startDate, "Lesson");
            return new LessonDateRange(startDate, startDate);
        }

        validateDateRange(startDate, endDate, "Lesson");
        return new LessonDateRange(startDate, endDate);
    }

    private String normalizeLanguage(String languageCode) {
        return SUPPORTED_LANGUAGES.contains(languageCode) ? languageCode : DEFAULT_LANGUAGE;
    }

    private Event findEventEntity(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));
    }

    private Event findEventDetails(Long eventId) {
        return eventRepository.findDetailsById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));
    }

    private Lesson findLessonEntity(Long lessonId) {
        return lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found: " + lessonId));
    }

    private Lesson findLessonDetails(Long lessonId) {
        return lessonRepository.findDetailsById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found: " + lessonId));
    }

    private MessageTemplate findTemplate(Long templateId) {
        return messageTemplateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Message template not found: " + templateId));
    }

    private void requireEventReader(AdminPrincipal actor) {
        if (!actor.hasAnyRole(AdminRole.SUPER_ADMIN, AdminRole.STAFF)) {
            throw new ForbiddenException("This account cannot access event management.");
        }
    }

    private void requireEventEditor(AdminPrincipal actor) {
        if (!actor.canManageEvents()) {
            throw new ForbiddenException("This account cannot manage events.");
        }
    }

    private void requireEventDeleter(AdminPrincipal actor) {
        if (!actor.canDeleteEvents()) {
            throw new ForbiddenException("Only super admins can delete events and lessons.");
        }
    }

    private void requireTemplateManager(AdminPrincipal actor) {
        if (!actor.canManageMessageTemplates()) {
            throw new ForbiddenException("Only super admins can manage message templates.");
        }
    }

    private void requirePromotionRenderer(AdminPrincipal actor) {
        if (!actor.canRenderPromotionMessages()) {
            throw new ForbiddenException("This account cannot render promotion messages.");
        }
    }

    private void requireTeacher(AdminPrincipal actor) {
        if (!actor.hasRole(AdminRole.TEACHER)) {
            throw new ForbiddenException("Teacher dashboard is available only for teacher accounts.");
        }
    }

    private String clean(String value) {
        return value.trim();
    }

    private String cleanNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private record LessonDateRange(
            LocalDate startDate,
            LocalDate endDate
    ) {
    }
}
