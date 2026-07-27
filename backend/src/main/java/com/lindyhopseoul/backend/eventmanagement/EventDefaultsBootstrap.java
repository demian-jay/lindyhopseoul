package com.lindyhopseoul.backend.eventmanagement;

import java.math.BigDecimal;
import java.time.LocalTime;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Seeds the registration defaults with exactly what
 * {@code src/EventManagementPanel.jsx} hardcoded before they became editable, so
 * moving them into the database changes nothing an admin can see.
 *
 * <p>Seeds per event type and only when that type has no row yet, so it fills in
 * a type added later without ever writing over an edit someone made.
 */
@Configuration
public class EventDefaultsBootstrap {

    /** Sunday is 0, matching JavaScript's {@code Date#getDay} — see EventTypeDefault. */
    private static final int WEDNESDAY = 3;
    private static final int SATURDAY = 6;

    private static final String KP_LOCATION = "KP DANCE HALL, 서울 강남구 학동로 166 지하 1층 B호";
    private static final String KP_GOOGLE_MAP_URL = "https://maps.app.goo.gl/ypA9zfFkKVqwJoT96";
    private static final String KP_NAVER_MAP_URL = "https://naver.me/x2jQH2Tt";
    private static final String DIALOGUE_LOCATION = "Dialogue, 서울 용산구 신흥로 31 지하1층";
    private static final String DIALOGUE_GOOGLE_MAP_URL = "https://maps.app.goo.gl/zw1a5deEpgU6t2CH9";
    private static final String DIALOGUE_NAVER_MAP_URL = "https://naver.me/GYC9bsWA";

    @Bean
    ApplicationRunner seedEventDefaults(EventTypeDefaultRepository repository) {
        return args -> {
            seedRegularClass(repository);
            seedParty(repository);
            seedDialogueParty(repository);
        };
    }

    private void seedRegularClass(EventTypeDefaultRepository repository) {
        if (repository.existsById(EventType.REGULAR_CLASS)) {
            return;
        }
        EventTypeDefault target = EventTypeDefault.create(EventType.REGULAR_CLASS, 2);
        target.update(
                SATURDAY, 2, LocalTime.of(17, 30), LocalTime.of(22, 0),
                KP_LOCATION, true, KP_GOOGLE_MAP_URL, KP_NAVER_MAP_URL, LessonType.LEVEL1
        );
        target.putTranslation("ko",
                "스윙팝 토요일 정규수업",
                "토요일에 진행되는 스윙팝 정규 수업입니다.",
                "스윙팝 토요일 정규수업은 Level 1, Level 2, Level 3 강습으로 구성됩니다. 처음 시작하는 분과 기본기를 다지는 분 모두 참여할 수 있으며 수업이 끝난 후에는 소셜댄스가 이어집니다.");
        target.putTranslation("en",
                "SwingPop Saturday Regular Classes",
                "SwingPop's regular Saturday swing dance classes.",
                "SwingPop Saturday Regular Classes consist of Level 1, Level 2, and Level 3 courses. Whether you're taking your first steps in swing dancing or looking to strengthen your fundamentals, there's a class for you. After the lessons, everyone is welcome to stay and enjoy social dancing.");

        lesson(target, LessonType.LEVEL1, LessonScheduleType.PERIOD, "19:00", "20:00", "60000", 1, true,
                "레벨 1 토요일 수업",
                "Level 1은 스윙댄스를 처음 시작하는 분들을 위한 입문 과정입니다. 기본 리듬과 스텝, 파트너와의 연결을 차근차근 배우며, 춤을 배우는 것을 넘어 스윙댄스 문화와 소셜댄스의 즐거움을 경험합니다. 춤을 처음 접하는 분도 부담 없이 참여할 수 있습니다, 누구나 환영합니다.",
                "Level 1 Saturday Class",
                "Level 1 is an introductory course designed for those taking their first steps into swing dancing. You'll gradually learn the fundamental rhythms, footwork, and partner connection while experiencing the culture of swing dancing and the joy of social dancing. No prior dance experience is required, everyone is welcome.");

        lesson(target, LessonType.LEVEL2, LessonScheduleType.PERIOD, "17:30", "19:00", "70000", 2, true,
                "레벨 2 토요일 수업",
                "트리플 스텝을 시작으로 스윙아웃, 슈가 푸시, 써클 등 린디합의 대표적인 패턴을 배웁니다. 단순히 동작을 익히는 것에 그치지 않고, 소셜댄스에서 다양한 사람들과 편안하게 춤출 수 있는 연결과 리드·팔로우를 함께 연습합니다.",
                "Level 2 Saturday Class",
                "Starting with the triple step, you'll learn fundamental Lindy Hop patterns such as the Swing Out, Sugar Push, and Circle. Beyond simply learning the moves, you'll also practice connection, leading, and following so you can dance comfortably with a variety of partners during social dancing.");

        lesson(target, LessonType.LEVEL3, LessonScheduleType.PERIOD, "17:30", "19:00", "80000", 3, true,
                "레벨 3 토요일 수업",
                "레벨 3에서는 Swing Out을 자연스럽게 출 수 있다는 것을 바탕으로 한 단계 더 깊이 있는 린디합을 배웁니다. Swing Out의 완성도를 높이고, 다양한 Variations와 리듬 변화, 방향 전환 등을 연습하며 춤의 폭을 넓혀갑니다. 새로운 동작을 배우는 것뿐만 아니라, 음악에 맞춰 더 자연스럽게 표현하고 파트너와 편안하게 소통하는 방법도 함께 익혀갑니다.",
                "Level 3 Saturday Class",
                "Level 3 builds on a solid understanding of the Swing Out and takes your Lindy Hop to the next level. You'll refine your Swing Out, explore a variety of variations, rhythm changes, and directional changes, and expand your range on the dance floor. Beyond learning new moves, you'll also develop smoother musical expression and more comfortable communication with different partners through connection, leading, and following.");

        lesson(target, LessonType.LEVEL4, LessonScheduleType.PERIOD, "16:00", "17:30", "90000", 4, true,
                "레벨 4 토요일 수업",
                "레벨 4는 린디합을 더욱 깊이 있게 배우는 과정입니다. 움직임의 완성도와 음악성, 파트너와의 연결을 더욱 섬세하게 다듬으며, 다양한 리듬과 즉흥적인 표현을 통해 자신만의 스타일을 만들어갑니다. 새로운 동작을 익히는 것에 그치지 않고, 어떤 파트너와도 자연스럽게 호흡하며 자유롭고 즐겁게 춤출 수 있는 능력을 키우는 것을 목표로 합니다.",
                "Level 4 Saturday Class",
                "Level 4 is designed for experienced dancers who are ready to deepen their understanding of Lindy Hop. Building on a strong technical foundation, you'll refine movement quality, musicality, and partner communication while exploring advanced concepts, creative variations, and improvisation. The focus is not just on learning more figures, but on developing the confidence and versatility to express yourself naturally with any partner on the social dance floor.");

        lesson(target, LessonType.WORKSHOP, LessonScheduleType.SINGLE_DAY, "16:30", "17:30", "10000", 6, false,
                "월별 워크샵",
                "월별 워크샵은 매월 새로운 주제로 진행되는 단기 워크샵입니다. 가요 라인댄스, 재즈 라인댄스, 찰스턴 등 다양한 장르를 가볍게 경험하며 춤의 폭을 넓혀보세요.",
                "Monthly Workshop",
                "A special workshop held every month with a new theme. From swing dance to Pop Line Dance, Jazz Line Dance, Charleston, and more, it's a great opportunity to explore different styles and expand your dancing experience.");

        lesson(target, LessonType.EXPERIENCE, LessonScheduleType.SINGLE_DAY, "19:00", "20:00", "30000", 1, false,
                "레벨 1 원데이 클래스",
                "스윙댄스를 처음 접하는 분들을 위한 하루 체험 클래스입니다. 기본 리듬과 스텝, 파트너와 함께 춤추는 즐거움을 부담 없이 경험해 보세요. 정규 수업을 시작하기 전 스윙댄스와 스윙팝을 만나볼 수 있는 가장 좋은 첫걸음입니다.",
                "Level 1 One-Day Class",
                "A one-day introductory class designed for complete beginners. Experience the basics of swing dancing, including rhythm, footwork, and partner connection, in a fun and welcoming environment. It's the perfect first step to discover swing dancing and get to know the SwingPop community before joining our regular classes.");

        repository.save(target);
    }

    private void seedParty(EventTypeDefaultRepository repository) {
        if (repository.existsById(EventType.PARTY)) {
            return;
        }
        // No weekday and no copy on purpose: a party is a one-off and is written
        // from scratch every time.
        EventTypeDefault target = EventTypeDefault.create(EventType.PARTY, 1);
        target.update(
                null, 1, LocalTime.of(16, 30), LocalTime.of(22, 0),
                KP_LOCATION, true, KP_GOOGLE_MAP_URL, KP_NAVER_MAP_URL, null
        );
        repository.save(target);
    }

    private void seedDialogueParty(EventTypeDefaultRepository repository) {
        if (repository.existsById(EventType.DIALOGUE_PARTY)) {
            return;
        }
        EventTypeDefault target = EventTypeDefault.create(EventType.DIALOGUE_PARTY, 3);
        target.update(
                WEDNESDAY, 3, LocalTime.of(19, 30), LocalTime.of(22, 0),
                DIALOGUE_LOCATION, true, DIALOGUE_GOOGLE_MAP_URL, DIALOGUE_NAVER_MAP_URL, LessonType.EXPERIENCE
        );
        target.putTranslation("ko",
                "Dialogue 소셜댄스",
                "해방촌 Dialogue에서 스윙댄스 체험수업과 소셜댄스 이벤트를 진행합니다.",
                "해방촌 Dialogue에서 스윙댄스 체험수업과 소셜댄스 이벤트를 진행합니다. 처음 오시는 분들도 가볍게 참여할 수 있는 체험수업은 7:30~8:00에 진행되며, 이후 8:00~10:00에는 함께 음악을 즐기며 자유롭게 춤추는 소셜댄스 시간이 이어집니다. 스윙댄스를 처음 접하는 분들도 편하게 참여하실 수 있으니 많은 참여 부탁드립니다.");
        target.putTranslation("en",
                "Dialogue Social Dance",
                "Join us at Dialogue in Haebangchon for a swing dance trial class and social dance event.",
                "Join us at Dialogue in Haebangchon for a swing dance trial class and social dance event. The trial class will be held from 7:30 to 8:00, followed by social dancing from 8:00 to 10:00, where everyone can enjoy the music and dance freely together. Beginners are very welcome, so feel free to join us.");

        lesson(target, LessonType.EXPERIENCE, LessonScheduleType.SINGLE_DAY, "19:30", "20:00", "15000", 1, false,
                "다이얼로그 원데이 클래스",
                "다이얼로그 전에 진행되는 30분 체험 클래스입니다. 스윙댄스가 처음인 분도 부담 없이 기본 스텝과 리듬을 배우며 스윙댄스의 즐거움을 경험해 보세요.",
                "Dialogue One-Day Class",
                "A 30-minute introductory class held before Dialogue. It's a fun and easy way to experience swing dancing before joining the social dance.");

        repository.save(target);
    }

    private void lesson(
            EventTypeDefault target,
            LessonType lessonType,
            LessonScheduleType scheduleType,
            String startTime,
            String endTime,
            String fee,
            int displayOrder,
            boolean roleSelectionEnabled,
            String koreanTitle,
            String koreanDescription,
            String englishTitle,
            String englishDescription
    ) {
        LessonTypeDefault lessonDefault = target.lessonDefaultFor(lessonType);
        lessonDefault.update(
                scheduleType,
                LocalTime.parse(startTime),
                LocalTime.parse(endTime),
                new BigDecimal(fee),
                displayOrder,
                roleSelectionEnabled
        );
        lessonDefault.putTranslation("ko", koreanTitle, koreanDescription);
        lessonDefault.putTranslation("en", englishTitle, englishDescription);
    }
}
