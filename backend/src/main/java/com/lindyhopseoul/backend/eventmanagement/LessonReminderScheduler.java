package com.lindyhopseoul.backend.eventmanagement;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;

import com.lindyhopseoul.backend.admin.UserAccount;
import com.lindyhopseoul.backend.push.NotificationType;
import com.lindyhopseoul.backend.push.PushNotificationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Sends teachers a heads-up the evening before a lesson they teach. Fires at
 * 20:00 Asia/Seoul and looks one day ahead. The query fetch-joins the teacher
 * accounts, so the entities stay usable after its own transaction closes and the
 * send runs in its own (so pruning a dead subscription is not blocked by a
 * read-only outer transaction).
 */
@Component
public class LessonReminderScheduler {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    private final LessonRepository lessonRepository;
    private final PushNotificationService pushNotificationService;

    public LessonReminderScheduler(
            LessonRepository lessonRepository,
            PushNotificationService pushNotificationService
    ) {
        this.lessonRepository = lessonRepository;
        this.pushNotificationService = pushNotificationService;
    }

    @Scheduled(cron = "0 0 20 * * *", zone = "Asia/Seoul")
    public void sendTomorrowLessonReminders() {
        LocalDate tomorrow = LocalDate.now(SEOUL).plusDays(1);
        for (Lesson lesson : lessonRepository.findForReminder(tomorrow, LessonStatus.PUBLISHED)) {
            List<String> teacherUserIds = lesson.getTeachers().stream()
                    .map(lessonTeacher -> lessonTeacher.getTeacherUser().getUserAccount())
                    .filter(Objects::nonNull)
                    .map(UserAccount::getUserId)
                    .filter(Objects::nonNull)
                    .toList();
            if (teacherUserIds.isEmpty()) {
                continue;
            }
            String time = lesson.getStartTime() == null ? "" : lesson.getStartTime().format(HH_MM) + " ";
            String body = "내일 " + time + koreanTitle(lesson) + " 수업이 있습니다.";
            pushNotificationService.send(teacherUserIds, NotificationType.LESSON_REMINDER, "내일 강습 알림", body, "/admin");
        }
    }

    private String koreanTitle(Lesson lesson) {
        return lesson.getTranslations().stream()
                .filter(translation -> "ko".equalsIgnoreCase(translation.getLanguageCode()))
                .map(LessonTranslation::getTitle)
                .filter(title -> title != null && !title.isBlank())
                .findFirst()
                .orElseGet(() -> lesson.getTranslations().stream()
                        .map(LessonTranslation::getTitle)
                        .filter(title -> title != null && !title.isBlank())
                        .findFirst()
                        .orElse("강습"));
    }
}
