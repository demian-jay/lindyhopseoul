package com.lindyhopseoul.backend.eventmanagement;

import java.util.Objects;

import com.lindyhopseoul.backend.exception.ConflictException;
import com.lindyhopseoul.backend.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class EventApplicationService {

    private final EventRepository eventRepository;
    private final LessonRepository lessonRepository;
    private final EventApplicationRepository eventApplicationRepository;

    public EventApplicationService(
            EventRepository eventRepository,
            LessonRepository lessonRepository,
            EventApplicationRepository eventApplicationRepository
    ) {
        this.eventRepository = eventRepository;
        this.lessonRepository = lessonRepository;
        this.eventApplicationRepository = eventApplicationRepository;
    }

    @Transactional
    public EventApplicationResponse create(EventApplicationCreateRequest request) {
        Event event = eventRepository.findById(request.eventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + request.eventId()));
        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new ConflictException("This event is not open for applications.");
        }

        Lesson lesson = null;
        if (request.lessonId() != null) {
            lesson = lessonRepository.findDetailsById(request.lessonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lesson not found: " + request.lessonId()));
            if (!Objects.equals(lesson.getEvent().getId(), event.getId())) {
                throw new ConflictException("Lesson does not belong to the selected event.");
            }
            if (lesson.getStatus() != LessonStatus.PUBLISHED) {
                throw new ConflictException("This lesson is not open for applications.");
            }
        }

        EventApplication application = EventApplication.create(
                event,
                lesson,
                clean(request.applicantName()),
                request.contactMethod(),
                clean(request.contactValue()),
                normalizeLanguage(request.languageCode())
        );

        return EventApplicationResponse.from(eventApplicationRepository.save(application));
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeLanguage(String languageCode) {
        return "en".equalsIgnoreCase(clean(languageCode)) ? "en" : "ko";
    }
}
