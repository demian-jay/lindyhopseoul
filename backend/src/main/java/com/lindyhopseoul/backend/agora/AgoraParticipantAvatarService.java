package com.lindyhopseoul.backend.agora;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;

import com.lindyhopseoul.backend.eventmanagement.ApplicationDanceRole;
import com.lindyhopseoul.backend.eventmanagement.Event;
import com.lindyhopseoul.backend.eventmanagement.EventApplication;
import com.lindyhopseoul.backend.eventmanagement.EventApplicationRepository;
import com.lindyhopseoul.backend.eventmanagement.EventManagementService;
import com.lindyhopseoul.backend.eventmanagement.EventTranslation;
import com.lindyhopseoul.backend.eventmanagement.Lesson;
import com.lindyhopseoul.backend.eventmanagement.LessonTranslation;
import com.lindyhopseoul.backend.member.Member;
import com.lindyhopseoul.backend.member.MemberPreferredLanguage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AgoraParticipantAvatarService {

    private static final int DISPLAY_LIMIT = 12;
    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    private final EventApplicationRepository eventApplicationRepository;
    private final Clock clock;

    @Autowired
    public AgoraParticipantAvatarService(EventApplicationRepository eventApplicationRepository) {
        this(eventApplicationRepository, Clock.system(SEOUL_ZONE));
    }

    AgoraParticipantAvatarService(EventApplicationRepository eventApplicationRepository, Clock clock) {
        this.eventApplicationRepository = eventApplicationRepository;
        this.clock = clock;
    }

    public AgoraParticipantAvatarListResponse findParticipantAvatars() {
        LocalDate today = LocalDate.now(clock);
        Map<Long, EventApplication> uniqueApplicationsByMemberId = new LinkedHashMap<>();
        eventApplicationRepository.findAgoraParticipantAvatarCandidates(today)
                .forEach(application -> {
                    Member member = application.getMember();
                    if (member != null && member.getId() != null) {
                        uniqueApplicationsByMemberId.putIfAbsent(member.getId(), application);
                    }
                });

        List<AgoraParticipantAvatarResponse> avatars = uniqueApplicationsByMemberId.values()
                .stream()
                .limit(DISPLAY_LIMIT)
                .map(this::toAvatar)
                .toList();
        int additionalCount = Math.max(0, uniqueApplicationsByMemberId.size() - avatars.size());
        return new AgoraParticipantAvatarListResponse(avatars, additionalCount);
    }

    private AgoraParticipantAvatarResponse toAvatar(EventApplication application) {
        Member member = application.getMember();
        String nickname = nickname(member);
        return new AgoraParticipantAvatarResponse(
                "participant-" + member.getId(),
                member.getId(),
                nickname,
                initial(nickname),
                role(application.getDanceRole()),
                classTitle(application),
                application.getLesson() == null ? "event" : "lesson"
        );
    }

    private String nickname(Member member) {
        String nickname = member.getNickname() == null ? "" : member.getNickname().trim();
        if (!nickname.isBlank()) {
            return nickname;
        }
        return member.getPreferredLanguage() == MemberPreferredLanguage.EN ? "Member" : "회원";
    }

    private String initial(String nickname) {
        String normalized = nickname == null ? "" : nickname.trim();
        return normalized.isBlank() ? "?" : normalized.substring(0, 1).toUpperCase(Locale.ROOT);
    }

    private String role(ApplicationDanceRole danceRole) {
        return danceRole == null ? null : danceRole.name().toLowerCase(Locale.ROOT);
    }

    private String classTitle(EventApplication application) {
        Lesson lesson = application.getLesson();
        if (lesson != null) {
            String lessonTitle = findLessonText(lesson, EventManagementService.DEFAULT_LANGUAGE, LessonTranslation::getTitle);
            if (!lessonTitle.isBlank()) {
                return lessonTitle;
            }
            return lesson.getLessonType() == null ? "" : lesson.getLessonType().name();
        }

        Event event = application.getEvent();
        String eventTitle = findEventText(event, EventManagementService.DEFAULT_LANGUAGE, EventTranslation::getTitle);
        if (!eventTitle.isBlank()) {
            return eventTitle;
        }
        return event.getEventType() == null ? "" : event.getEventType().name();
    }

    private String findEventText(Event event, String languageCode, Function<EventTranslation, String> reader) {
        return event.getTranslations()
                .stream()
                .filter(translation -> translation.getLanguageCode().equals(languageCode))
                .findFirst()
                .or(() -> event.getTranslations()
                        .stream()
                        .filter(translation -> translation.getLanguageCode().equals(EventManagementService.DEFAULT_LANGUAGE))
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
                        .filter(translation -> translation.getLanguageCode().equals(EventManagementService.DEFAULT_LANGUAGE))
                        .findFirst())
                .map(reader)
                .orElse("");
    }
}
