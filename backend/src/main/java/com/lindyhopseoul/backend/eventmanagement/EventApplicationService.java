package com.lindyhopseoul.backend.eventmanagement;

import java.util.Objects;

import com.lindyhopseoul.backend.exception.BadRequestException;
import com.lindyhopseoul.backend.exception.ConflictException;
import com.lindyhopseoul.backend.exception.ResourceNotFoundException;
import com.lindyhopseoul.backend.member.Member;
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
        return create(request, null);
    }

    @Transactional
    public EventApplicationResponse create(EventApplicationCreateRequest request, Member currentMember) {
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

        Long memberId = currentMember == null ? null : currentMember.getId();
        if (memberId != null && eventApplicationRepository.countByMemberIdAndApplicationTarget(
                memberId,
                event.getId(),
                lesson == null ? null : lesson.getId()
        ) > 0) {
            throw new ConflictException("You have already applied for this class.");
        }

        EventApplication application = EventApplication.create(
                event,
                lesson,
                currentMember,
                applicantName(request, currentMember),
                normalizeContactMethod(request.contactMethod()),
                clean(request.contactValue()),
                clean(request.requestMemo()),
                normalizeLanguage(request.languageCode()),
                normalizeDanceRole(lesson, request.danceRole())
        );

        return EventApplicationResponse.from(eventApplicationRepository.save(application));
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }

    private String applicantName(EventApplicationCreateRequest request, Member currentMember) {
        if (currentMember != null) {
            return memberApplicantName(currentMember);
        }

        String applicantName = clean(request.applicantName());
        if (applicantName.isBlank()) {
            throw new BadRequestException("Applicant name is required.");
        }
        if (applicantName.length() > 100) {
            throw new BadRequestException("Applicant name must be 100 characters or fewer.");
        }
        return applicantName;
    }

    private String memberApplicantName(Member member) {
        String nickname = clean(member.getNickname());
        if (!nickname.isBlank()) {
            return truncate(nickname, 100);
        }

        String displayName = clean(member.getDisplayName());
        if (!displayName.isBlank()) {
            return truncate(displayName, 100);
        }

        String emailName = emailDisplayName(member.getEmail());
        if (!emailName.isBlank()) {
            return truncate(emailName, 100);
        }

        Long memberId = member.getId();
        return memberId == null ? "Member" : "Member " + memberId;
    }

    private String emailDisplayName(String email) {
        String normalizedEmail = clean(email);
        int atIndex = normalizedEmail.indexOf('@');
        if (atIndex > 0) {
            return normalizedEmail.substring(0, atIndex);
        }
        return normalizedEmail;
    }

    private String truncate(String value, int maxLength) {
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private String normalizeLanguage(String languageCode) {
        return "en".equalsIgnoreCase(clean(languageCode)) ? "en" : "ko";
    }

    private ApplicationContactMethod normalizeContactMethod(ApplicationContactMethod contactMethod) {
        return contactMethod == null ? ApplicationContactMethod.KAKAO_TALK : contactMethod;
    }

    private ApplicationDanceRole normalizeDanceRole(Lesson lesson, ApplicationDanceRole danceRole) {
        if (lesson == null || !lesson.isRoleSelectionEnabled()) {
            return null;
        }
        if (danceRole == null) {
            throw new ConflictException("Dance role is required for this lesson.");
        }
        return danceRole;
    }
}
