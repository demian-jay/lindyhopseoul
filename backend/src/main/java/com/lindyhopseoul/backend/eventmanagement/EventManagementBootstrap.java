package com.lindyhopseoul.backend.eventmanagement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.lindyhopseoul.backend.admin.AdminLanguage;
import com.lindyhopseoul.backend.admin.AdminRole;
import com.lindyhopseoul.backend.admin.PasswordHasher;
import com.lindyhopseoul.backend.admin.TeacherUser;
import com.lindyhopseoul.backend.admin.TeacherUserRepository;
import com.lindyhopseoul.backend.admin.UserAccount;
import com.lindyhopseoul.backend.admin.UserAccountRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class EventManagementBootstrap {

    @Bean
    ApplicationRunner seedEventManagement(
            EventRepository eventRepository,
            MessageTemplateRepository messageTemplateRepository,
            TeacherUserRepository teacherUserRepository,
            UserAccountRepository userAccountRepository,
            PasswordHasher passwordHasher,
            JdbcTemplate jdbcTemplate
    ) {
        return args -> {
            migrateLegacyDates(jdbcTemplate);
            migrateLegacyStatuses(jdbcTemplate);
            List<TeacherUser> teachers = ensureSampleTeachers(teacherUserRepository, userAccountRepository, passwordHasher);

            if (eventRepository.count() == 0) {
                seedEvents(eventRepository, teachers);
            } else if (!eventRepository.existsByEventType(EventType.DIALOGUE_PARTY)) {
                seedDialogueParty(eventRepository, teachers);
            }

            if (messageTemplateRepository.count() == 0) {
                seedMessageTemplates(messageTemplateRepository);
            }
        };
    }

    private void migrateLegacyStatuses(JdbcTemplate jdbcTemplate) {
        String eventTable = findActualTableName(jdbcTemplate, "SWINGPOP_EVENT");
        String lessonTable = findActualTableName(jdbcTemplate, "LESSON");
        if (eventTable != null && hasColumn(jdbcTemplate, eventTable, "status")) {
            jdbcTemplate.execute(
                    "update `" + eventTable + "` "
                            + "set status = case when status = 'PUBLISHED' then 'PUBLISHED' else 'FINISHED' end "
                            + "where status is null or status not in ('PUBLISHED', 'FINISHED')"
            );
        }
        if (lessonTable != null && hasColumn(jdbcTemplate, lessonTable, "status")) {
            jdbcTemplate.execute(
                    "update `" + lessonTable + "` "
                            + "set status = case when status = 'PUBLISHED' then 'PUBLISHED' else 'FINISHED' end "
                            + "where status is null or status not in ('PUBLISHED', 'FINISHED')"
            );
        }
    }

    private void migrateLegacyDates(JdbcTemplate jdbcTemplate) {
        String eventTable = findActualTableName(jdbcTemplate, "SWINGPOP_EVENT");
        String lessonTable = findActualTableName(jdbcTemplate, "LESSON");
        if (eventTable == null || lessonTable == null) {
            return;
        }

        if (hasColumn(jdbcTemplate, eventTable, "event_date")
                && hasColumn(jdbcTemplate, eventTable, "start_date")
                && hasColumn(jdbcTemplate, eventTable, "end_date")) {
            jdbcTemplate.execute(
                    "update `" + eventTable + "` "
                            + "set start_date = coalesce(start_date, event_date), "
                            + "    end_date = coalesce(end_date, event_date) "
                            + "where (start_date is null or end_date is null) "
                            + "  and event_date is not null"
            );
            relaxLegacyColumn(jdbcTemplate, eventTable, "event_date", "date");
        }

        if (hasColumn(jdbcTemplate, lessonTable, "start_date")
                && hasColumn(jdbcTemplate, lessonTable, "end_date")
                && hasColumn(jdbcTemplate, lessonTable, "schedule_type")
                && hasColumn(jdbcTemplate, eventTable, "start_date")
                && hasColumn(jdbcTemplate, eventTable, "end_date")) {
            jdbcTemplate.execute(
                    "update `" + lessonTable + "` lesson "
                            + "join `" + eventTable + "` ev on lesson.event_id = ev.id "
                            + "set lesson.start_date = coalesce(lesson.start_date, ev.start_date), "
                            + "    lesson.end_date = coalesce(lesson.end_date, ev.end_date), "
                            + "    lesson.schedule_type = coalesce(lesson.schedule_type, "
                            + "        case when ev.event_type = 'REGULAR_CLASS' then 'PERIOD' else 'SINGLE_DAY' end) "
                            + "where lesson.start_date is null "
                            + "   or lesson.end_date is null "
                            + "   or lesson.schedule_type is null"
            );
        }
    }

    private String findActualTableName(JdbcTemplate jdbcTemplate, String tableName) {
        List<Map<String, Object>> tables = jdbcTemplate.queryForList(
                """
                        select table_name
                        from information_schema.tables
                        where table_schema = database()
                          and lower(table_name) = lower(?)
                        """,
                tableName
        );
        if (tables.isEmpty()) {
            return null;
        }
        return String.valueOf(tables.get(0).get("table_name"));
    }

    private boolean hasColumn(JdbcTemplate jdbcTemplate, String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject(
                """
                        select count(*)
                        from information_schema.columns
                        where table_schema = database()
                          and lower(table_name) = lower(?)
                          and lower(column_name) = lower(?)
                        """,
                Integer.class,
                tableName,
                columnName
        );
        return count != null && count > 0;
    }

    private void relaxLegacyColumn(
            JdbcTemplate jdbcTemplate,
            String tableName,
            String columnName,
            String columnType
    ) {
        List<Map<String, Object>> columns = jdbcTemplate.queryForList(
                """
                        select column_name
                        from information_schema.columns
                        where table_schema = database()
                          and lower(table_name) = lower(?)
                          and lower(column_name) = lower(?)
                        """,
                tableName,
                columnName
        );
        if (!columns.isEmpty()) {
            String actualColumnName = String.valueOf(columns.get(0).get("column_name"));
            jdbcTemplate.execute(
                    "alter table `" + tableName + "` modify `" + actualColumnName + "` " + columnType + " null"
            );
        }
    }

    private List<TeacherUser> ensureSampleTeachers(
            TeacherUserRepository teacherUserRepository,
            UserAccountRepository userAccountRepository,
            PasswordHasher passwordHasher
    ) {
        List<TeacherUser> activeTeachers = teacherUserRepository.findActiveTeacherRoleProfiles();
        if (!activeTeachers.isEmpty()) {
            return activeTeachers;
        }

        TeacherUser firstTeacher = ensureSampleTeacher(
                teacherUserRepository,
                userAccountRepository,
                passwordHasher,
                "SAMPLE_TEACHER_1",
                "Sample Teacher 1",
                "teacher1",
                AdminLanguage.Eng
        );
        TeacherUser secondTeacher = ensureSampleTeacher(
                teacherUserRepository,
                userAccountRepository,
                passwordHasher,
                "SAMPLE_TEACHER_2",
                "Sample Teacher 2",
                "teacher2",
                AdminLanguage.Kor
        );

        return List.of(firstTeacher, secondTeacher);
    }

    private TeacherUser ensureSampleTeacher(
            TeacherUserRepository teacherUserRepository,
            UserAccountRepository userAccountRepository,
            PasswordHasher passwordHasher,
            String teacherUserId,
            String teacherName,
            String loginId,
            AdminLanguage langCd
    ) {
        UserAccount user = userAccountRepository.findByLoginId(loginId)
                .orElseGet(() -> userAccountRepository.save(UserAccount.create(
                        null,
                        teacherName,
                        loginId,
                        null,
                        passwordHasher.hash("1234"),
                        langCd,
                        List.of(AdminRole.TEACHER)
                )));
        if (!user.hasRole(AdminRole.TEACHER)) {
            user.addRole(AdminRole.TEACHER);
            userAccountRepository.save(user);
        }

        TeacherUser teacherUser = teacherUserRepository.findById(teacherUserId)
                .or(() -> teacherUserRepository.findFirstByUserAccount_UserIdOrderByTeacherUserNmAsc(user.getUserId()))
                .map(teacher -> {
                    teacher.updateProfile(teacherName, user, "Y", "SYSTEM");
                    return teacher;
                })
                .orElseGet(() -> TeacherUser.createProfile(
                        teacherUserId,
                        teacherName,
                        user,
                        "SYSTEM"
                ));

        return teacherUserRepository.save(teacherUser);
    }

    private void seedEvents(EventRepository eventRepository, List<TeacherUser> teachers) {
        TeacherUser firstTeacher = teachers.get(0);
        TeacherUser secondTeacher = teachers.size() > 1 ? teachers.get(1) : firstTeacher;

        Event regularClass = Event.create(
                EventType.REGULAR_CLASS,
                LocalDate.of(2026, 7, 6),
                LocalDate.of(2026, 7, 27),
                LocalTime.of(14, 0),
                LocalTime.of(17, 30),
                "Swingpop Studio",
                EventStatus.PUBLISHED,
                10,
                true,
                "https://maps.app.goo.gl/ypA9zfFkKVqwJoT96",
                "https://naver.me/x2jQH2Tt"
        );
        regularClass.replaceTranslations(Set.of(
                new EventTranslation(
                        "ko",
                        "스윙팝 토요 정규수업",
                        "토요일에 진행되는 스윙팝 정규 레벨 수업",
                        "스윙팝 토요 정규수업은 Level 1과 Level 2 강습으로 구성됩니다. 처음 시작하는 분과 기본기를 다지는 분 모두 참여할 수 있습니다."
                ),
                new EventTranslation(
                        "en",
                        "Swingpop Saturday Regular Class",
                        "Swingpop regular level classes held on Saturdays",
                        "Swingpop Saturday Regular Class includes Level 1 and Level 2 lessons for new dancers and students building stronger fundamentals."
                )
        ));
        regularClass.addLesson(sampleLesson(
                LessonType.LEVEL1,
                LessonScheduleType.PERIOD,
                LocalDate.of(2026, 7, 6),
                LocalDate.of(2026, 7, 27),
                LocalTime.of(14, 0),
                LocalTime.of(15, 20),
                new BigDecimal("80000"),
                LessonStatus.PUBLISHED,
                10,
                firstTeacher,
                secondTeacher,
                "Level 1 Beginner Class",
                "처음 스윙댄스를 시작하는 분을 위한 Level 1 입문 수업입니다.",
                "Level 1 Beginner Class",
                "A Level 1 beginner class for people starting swing dance for the first time."
        ));
        regularClass.addLesson(sampleLesson(
                LessonType.LEVEL2,
                LessonScheduleType.PERIOD,
                LocalDate.of(2026, 7, 6),
                LocalDate.of(2026, 7, 27),
                LocalTime.of(15, 40),
                LocalTime.of(17, 0),
                new BigDecimal("90000"),
                LessonStatus.PUBLISHED,
                20,
                secondTeacher,
                firstTeacher,
                "Level 2 Class",
                "기본 리듬과 연결을 바탕으로 소셜댄스 활용도를 높이는 수업입니다.",
                "Level 2 Class",
                "A class for improving social dance comfort with rhythm, connection, and core patterns."
        ));

        Event party = Event.create(
                EventType.PARTY,
                LocalDate.of(2026, 7, 20),
                LocalDate.of(2026, 7, 20),
                LocalTime.of(18, 0),
                LocalTime.of(22, 30),
                "Swingpop Hall",
                EventStatus.PUBLISHED,
                20
        );
        party.replaceTranslations(Set.of(
                new EventTranslation(
                        "ko",
                        "스윙팝 11주년 파티",
                        "스윙팝 11주년을 함께 축하하는 파티",
                        "스윙팝 11주년 파티에서는 체험수업, 찰스턴 워크샵, 소셜댄스가 함께 진행됩니다."
                ),
                new EventTranslation(
                        "en",
                        "Swingpop 11th Anniversary Party",
                        "A party celebrating Swingpop's 11th anniversary",
                        "Swingpop 11th Anniversary Party includes a beginner taster class, a Charleston workshop, and social dancing."
                )
        ));
        party.addLesson(sampleLesson(
                LessonType.WORKSHOP,
                LessonScheduleType.SINGLE_DAY,
                LocalDate.of(2026, 7, 20),
                LocalDate.of(2026, 7, 20),
                LocalTime.of(18, 20),
                LocalTime.of(19, 20),
                new BigDecimal("30000"),
                LessonStatus.PUBLISHED,
                10,
                firstTeacher,
                secondTeacher,
                "Charleston Workshop",
                "파티 전에 신나는 찰스턴 기본 움직임과 응용을 배우는 워크샵입니다.",
                "Charleston Workshop",
                "A pre-party workshop covering energetic Charleston basics and variations."
        ));
        party.addLesson(sampleLesson(
                LessonType.EXPERIENCE,
                LessonScheduleType.SINGLE_DAY,
                LocalDate.of(2026, 7, 20),
                LocalDate.of(2026, 7, 20),
                LocalTime.of(19, 30),
                LocalTime.of(20, 0),
                BigDecimal.ZERO,
                LessonStatus.PUBLISHED,
                20,
                secondTeacher,
                firstTeacher,
                "Beginner Taster Class",
                "처음 방문한 분도 바로 참여할 수 있는 무료 체험수업입니다.",
                "Beginner Taster Class",
                "A free taster class that first-time visitors can join right away."
        ));

        Event dialogueParty = createDialogueParty(firstTeacher, secondTeacher);

        eventRepository.saveAll(List.of(regularClass, party, dialogueParty));
    }

    private void seedDialogueParty(EventRepository eventRepository, List<TeacherUser> teachers) {
        TeacherUser firstTeacher = teachers.get(0);
        TeacherUser secondTeacher = teachers.size() > 1 ? teachers.get(1) : firstTeacher;
        eventRepository.save(createDialogueParty(firstTeacher, secondTeacher));
    }

    private Event createDialogueParty(TeacherUser firstTeacher, TeacherUser secondTeacher) {
        Event dialogueParty = Event.create(
                EventType.DIALOGUE_PARTY,
                LocalDate.of(2026, 8, 5),
                LocalDate.of(2026, 8, 5),
                LocalTime.of(19, 30),
                LocalTime.of(22, 0),
                "Dialogue, 서울 용산구 신흥로 31 지하1층",
                EventStatus.PUBLISHED,
                30
        );
        dialogueParty.replaceTranslations(Set.of(
                new EventTranslation(
                        "ko",
                        "Dialogue 소셜댄스",
                        "해방촌 Dialogue에서 스윙댄스 체험수업과 소셜댄스 이벤트를 진행합니다.",
                        "해방촌 Dialogue에서 스윙댄스 체험수업과 소셜댄스 이벤트를 진행합니다. 처음 오시는 분들도 가볍게 참여할 수 있는 체험수업은 7:30~8:00에 진행되며, 이후 8:00~10:00에는 함께 음악을 즐기며 자유롭게 춤추는 소셜댄스 시간이 이어집니다. 스윙댄스를 처음 접하는 분들도 편하게 참여하실 수 있으니 많은 참여 부탁드립니다."
                ),
                new EventTranslation(
                        "en",
                        "Dialogue Social Dance",
                        "Join us at Dialogue in Haebangchon for a swing dance trial class and social dance event.",
                        "Join us at Dialogue in Haebangchon for a swing dance trial class and social dance event. The trial class will be held from 7:30 to 8:00, followed by social dancing from 8:00 to 10:00, where everyone can enjoy the music and dance freely together. Beginners are very welcome, so feel free to join us."
                )
        ));
        dialogueParty.addLesson(sampleLesson(
                LessonType.EXPERIENCE,
                LessonScheduleType.SINGLE_DAY,
                LocalDate.of(2026, 8, 5),
                LocalDate.of(2026, 8, 5),
                LocalTime.of(19, 30),
                LocalTime.of(20, 0),
                BigDecimal.ZERO,
                LessonStatus.PUBLISHED,
                10,
                firstTeacher,
                secondTeacher,
                "스윙댄스 체험수업",
                "스윙댄스를 처음 접하는 분들도 편하게 참여할 수 있는 체험수업입니다.",
                "Swing Dance Trial Class",
                "A beginner-friendly trial class for people trying swing dance for the first time."
        ));
        return dialogueParty;
    }

    private Lesson sampleLesson(
            LessonType lessonType,
            LessonScheduleType scheduleType,
            LocalDate startDate,
            LocalDate endDate,
            LocalTime startTime,
            LocalTime endTime,
            BigDecimal fee,
            LessonStatus status,
            Integer displayOrder,
            TeacherUser firstTeacher,
            TeacherUser secondTeacher,
            String koTitle,
            String koDescription,
            String enTitle,
            String enDescription
    ) {
        Lesson lesson = Lesson.create(
                null,
                lessonType,
                scheduleType,
                startDate,
                endDate,
                startTime,
                endTime,
                fee,
                "KRW",
                status,
                displayOrder
        );
        lesson.replaceTranslations(Set.of(
                new LessonTranslation("ko", koTitle, koDescription),
                new LessonTranslation("en", enTitle, enDescription)
        ));
        Set<LessonTeacher> lessonTeachers = new LinkedHashSet<>();
        lessonTeachers.add(new LessonTeacher(firstTeacher, "LEAD", 10));
        lessonTeachers.add(new LessonTeacher(secondTeacher, "FOLLOW", 20));
        lesson.replaceTeachers(lessonTeachers);
        return lesson;
    }

    private void seedMessageTemplates(MessageTemplateRepository messageTemplateRepository) {
        messageTemplateRepository.saveAll(List.of(
                MessageTemplate.create(
                        "파티 홍보글 초안",
                        MessageTemplateType.PARTY_PROMOTION,
                        """
                                [{{event.title.ko}}]

                                {{event.shortDescription.ko}}

                                날짜: {{event.date}}
                                시간: {{event.startTime}}-{{event.endTime}}
                                장소: {{event.location}}

                                강습 안내:
                                {{lessons.all.ko}}
                                """,
                        "Y"
                ),
                MessageTemplate.create(
                        "정규수업 홍보글 초안",
                        MessageTemplateType.REGULAR_CLASS_PROMOTION,
                        """
                                {{event.title.ko}}

                                {{event.description.ko}}

                                Level 1:
                                {{lessons.level1.title.ko}}
                                {{lessons.level1.time}}
                                {{lessons.level1.fee}}

                                Level 2:
                                {{lessons.level2.title.ko}}
                                {{lessons.level2.time}}
                                {{lessons.level2.fee}}
                                """,
                        "Y"
                ),
                MessageTemplate.create(
                        "강습 안내글 초안",
                        MessageTemplateType.LESSON_PROMOTION,
                        """
                                {{event.title.en}}

                                {{event.shortDescription.en}}

                                Date: {{event.date}}
                                Time: {{event.startTime}}-{{event.endTime}}
                                Location: {{event.location}}

                                Lessons:
                                {{lessons.all.en}}
                                """,
                        "Y"
                )
        ));
    }
}
