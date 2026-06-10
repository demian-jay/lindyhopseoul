package com.lindyhopseoul.backend.knowledgebase;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class KnowledgeBaseBootstrap {

    @Bean
    ApplicationRunner seedKnowledgeBase(
            KnowledgeCategoryRepository categoryRepository,
            KnowledgeItemRepository itemRepository,
            KnowledgeCategoryTranslationRepository categoryTranslationRepository,
            KnowledgeItemTranslationRepository itemTranslationRepository,
            JdbcTemplate jdbcTemplate
    ) {
        return args -> {
            relaxLegacyColumns(jdbcTemplate);

            if (categoryTranslationRepository.count() > 0 || itemTranslationRepository.count() > 0) {
                return;
            }

            List<SampleCategory> sampleCategories = sampleCategories();
            Map<String, KnowledgeCategory> categories = seedCategories(categoryRepository, sampleCategories);
            seedItems(itemRepository, categories, sampleItems());
        };
    }

    private Map<String, KnowledgeCategory> seedCategories(
            KnowledgeCategoryRepository categoryRepository,
            List<SampleCategory> samples
    ) {
        Map<Integer, KnowledgeCategory> existingByOrder = new LinkedHashMap<>();
        categoryRepository.findAllWithTranslations()
                .forEach(category -> existingByOrder.putIfAbsent(category.getDisplayOrder(), category));

        Map<String, KnowledgeCategory> categories = new LinkedHashMap<>();
        for (SampleCategory sample : samples) {
            KnowledgeCategory category = existingByOrder.getOrDefault(
                    sample.displayOrder(),
                    KnowledgeCategory.create(sample.displayOrder())
            );
            category.update(sample.displayOrder());
            category.replaceTranslations(java.util.Set.of(
                    new KnowledgeCategoryTranslation("ko", sample.koName(), sample.koDescription()),
                    new KnowledgeCategoryTranslation("en", sample.enName(), sample.enDescription())
            ));
            categories.put(sample.key(), categoryRepository.save(category));
        }
        return categories;
    }

    private void seedItems(
            KnowledgeItemRepository itemRepository,
            Map<String, KnowledgeCategory> categories,
            List<SampleItem> samples
    ) {
        Map<Integer, KnowledgeItem> existingByOrder = new LinkedHashMap<>();
        itemRepository.findAllWithCategory()
                .forEach(item -> existingByOrder.putIfAbsent(item.getDisplayOrder(), item));

        for (SampleItem sample : samples) {
            KnowledgeItem item = existingByOrder.getOrDefault(
                    sample.displayOrder(),
                    KnowledgeItem.create(
                            categories.get(sample.categoryKey()),
                            KnowledgeItemStatus.PUBLISHED,
                            sample.displayOrder(),
                            sample.decisionDate(),
                            sample.effectiveFrom(),
                            sample.effectiveTo(),
                            sample.sourceNote()
                    )
            );
            item.update(
                    categories.get(sample.categoryKey()),
                    KnowledgeItemStatus.PUBLISHED,
                    sample.displayOrder(),
                    sample.decisionDate(),
                    sample.effectiveFrom(),
                    sample.effectiveTo(),
                    sample.sourceNote()
            );
            item.replaceTranslations(java.util.Set.of(
                    new KnowledgeItemTranslation(
                            "ko",
                            sample.koTitle(),
                            sample.koSummary(),
                            sample.koContent(),
                            sample.koTags()
                    ),
                    new KnowledgeItemTranslation(
                            "en",
                            sample.enTitle(),
                            sample.enSummary(),
                            sample.enContent(),
                            sample.enTags()
                    )
            ));
            itemRepository.save(item);
        }
    }

    private void relaxLegacyColumns(JdbcTemplate jdbcTemplate) {
        relaxLegacyColumn(jdbcTemplate, "KNOWLEDGE_CATEGORY", "NAME", "varchar(120)");
        relaxLegacyColumn(jdbcTemplate, "KNOWLEDGE_ITEM", "TITLE", "varchar(160)");
        relaxLegacyColumn(jdbcTemplate, "KNOWLEDGE_ITEM", "SUMMARY", "varchar(500)");
        relaxLegacyColumn(jdbcTemplate, "KNOWLEDGE_ITEM", "CONTENT", "text");
    }

    private void relaxLegacyColumn(JdbcTemplate jdbcTemplate, String tableName, String columnName, String columnType) {
        List<Map<String, Object>> columns = jdbcTemplate.queryForList(
                """
                        select table_name, column_name
                        from information_schema.columns
                        where table_schema = database()
                          and lower(table_name) = lower(?)
                          and lower(column_name) = lower(?)
                        """,
                tableName,
                columnName
        );

        if (!columns.isEmpty()) {
            String actualTableName = String.valueOf(columns.get(0).get("table_name"));
            String actualColumnName = String.valueOf(columns.get(0).get("column_name"));
            jdbcTemplate.execute(
                    "alter table `" + actualTableName + "` modify `" + actualColumnName + "` " + columnType + " null"
            );
        }
    }

    private List<SampleCategory> sampleCategories() {
        return List.of(
                new SampleCategory(
                        "class-policy",
                        10,
                        "수업 정책",
                        "수업 가격, 수강 기준, 레벨 이동 규칙",
                        "Class Policy",
                        "Class prices, attendance rules, and level-up policies"
                ),
                new SampleCategory(
                        "level-rule",
                        20,
                        "레벨 규칙",
                        "레벨업 기준과 진급 판단 기준",
                        "Level Rules",
                        "Level-up criteria and promotion decisions"
                ),
                new SampleCategory(
                        "staff-work",
                        30,
                        "운영진 업무",
                        "운영진 공통 업무 범위와 담당 기준",
                        "Staff Work",
                        "Shared staff responsibilities and ownership rules"
                ),
                new SampleCategory(
                        "teacher-work",
                        40,
                        "강사 업무",
                        "강사 수업 준비와 수업 운영 기준",
                        "Teacher Work",
                        "Teacher preparation and class operation standards"
                ),
                new SampleCategory(
                        "curriculum",
                        50,
                        "커리큘럼",
                        "각 레벨별 수업 내용과 핵심 학습 목표",
                        "Curriculum",
                        "Class content and learning goals by level"
                ),
                new SampleCategory(
                        "venue-rule",
                        60,
                        "장소 이용 규칙",
                        "댄스홀과 대관 공간 이용 규칙",
                        "Venue Rules",
                        "Dance hall and rental space usage rules"
                ),
                new SampleCategory(
                        "party-operation",
                        70,
                        "파티 운영",
                        "소셜 파티 준비와 현장 운영 기준",
                        "Party Operations",
                        "Social party preparation and on-site operations"
                ),
                new SampleCategory(
                        "partnership",
                        80,
                        "외부 협업",
                        "외부 단체 협업, 초청, 공동 행사 기준",
                        "Partnerships",
                        "External collaborations, invitations, and joint event rules"
                )
        );
    }

    private List<SampleItem> sampleItems() {
        return List.of(
                new SampleItem(
                        "class-policy",
                        10,
                        LocalDate.of(2026, 6, 9),
                        LocalDate.of(2026, 7, 1),
                        null,
                        "운영진 회의 샘플 정책 / Sample staff meeting policy",
                        "Level 1 수업 가격",
                        "Level 1 4주 수업료 및 댄스홀 입장료 안내",
                        """
                                Level 1 수업은 4주 과정이며, 수업료와 댄스홀 입장료를 신청 페이지에 함께 안내합니다.

                                가격 공지 시 포함할 항목:
                                - 전체 수업 횟수
                                - 수업 시간
                                - 댄스홀 입장료 포함 여부
                                - 환불 가능 기간
                                """,
                        "level1, 가격, 수업료",
                        "Level 1 Class Price",
                        "Information about the 4-week Level 1 class fee and dance hall entrance fee",
                        """
                                The Level 1 class is a 4-week course. The registration page should clearly explain both the class fee and any dance hall entrance fee.

                                Price notices should include:
                                - total number of classes
                                - class time
                                - whether the dance hall entrance fee is included
                                - the refund window
                                """,
                        "level1, price, class fee"
                ),
                new SampleItem(
                        "level-rule",
                        20,
                        LocalDate.of(2026, 6, 9),
                        LocalDate.of(2026, 7, 1),
                        null,
                        "레벨 운영 기준 샘플 / Sample level policy",
                        "Level 2 진급 기준",
                        "Level 1 수강생이 Level 2로 올라가기 전에 확인해야 할 기본 기준",
                        """
                                Level 2 진급은 기본 리듬과 파트너 커뮤니케이션 이해를 기준으로 판단합니다.

                                확인 항목:
                                - 6-count basic rhythm 유지
                                - tuck turn, pass by 등 기본 패턴 이해
                                - 안전한 연결
                                - 소셜 댄스 매너 준수
                                """,
                        "level2, 진급, 레벨업",
                        "Level 2 Promotion Criteria",
                        "Basic criteria students should meet before moving from Level 1 to Level 2",
                        """
                                Promotion to Level 2 is based on basic rhythm control and an understanding of partner communication.

                                Checkpoints:
                                - maintaining 6-count basic rhythm
                                - understanding basic patterns such as tuck turn and pass by
                                - safe connection
                                - social dance etiquette
                                """,
                        "level2, promotion, level up"
                ),
                new SampleItem(
                        "staff-work",
                        30,
                        LocalDate.of(2026, 6, 9),
                        LocalDate.of(2026, 7, 1),
                        null,
                        "운영진 온보딩 샘플 / Sample staff onboarding",
                        "운영진 공통 업무 범위",
                        "운영진이 공통으로 맡는 신청, 공지, 현장 지원 업무 범위",
                        """
                                운영진 공통 업무는 수업과 커뮤니티 운영이 끊기지 않게 만드는 일입니다.

                                주요 업무:
                                - 신청 현황 확인
                                - 수강생 문의 응대
                                - 수업 전후 공지 발송
                                - 장소 준비 상태 확인
                                - 강사와 일정 변경 사항 공유
                                """,
                        "운영진, 업무, 공지",
                        "Shared Staff Responsibilities",
                        "Registration, announcement, and on-site support tasks shared by staff",
                        """
                                Shared staff work keeps classes and community operations running smoothly.

                                Main tasks:
                                - checking registration status
                                - responding to student questions
                                - sending announcements before and after class
                                - checking venue readiness
                                - sharing schedule changes with teachers
                                """,
                        "staff, operations, announcements"
                ),
                new SampleItem(
                        "teacher-work",
                        40,
                        LocalDate.of(2026, 6, 9),
                        LocalDate.of(2026, 7, 1),
                        null,
                        "강사 업무 샘플 / Sample teacher work",
                        "강사의 수업 전 준비 업무",
                        "강사가 수업 전에 확인해야 할 커리큘럼, 음악, 출석 관련 준비 항목",
                        """
                                강사는 수업 전 커리큘럼 진행 상황과 당일 목표를 확인합니다.

                                준비 체크리스트:
                                - 지난 수업 복습 범위 확인
                                - 당일 핵심 패턴과 리듬 정리
                                - 사용할 음악 준비
                                - 운영진과 전달 사항 공유
                                """,
                        "강사, 수업준비, 커리큘럼",
                        "Teacher Pre-Class Preparation",
                        "Curriculum, music, and attendance items teachers should check before class",
                        """
                                Teachers should check the curriculum progress and the goal for the day before class.

                                Preparation checklist:
                                - review scope from the previous class
                                - key patterns and rhythms for the day
                                - music to use in class
                                - notes to share with staff
                                """,
                        "teacher, class prep, curriculum"
                ),
                new SampleItem(
                        "curriculum",
                        50,
                        LocalDate.of(2026, 6, 9),
                        LocalDate.of(2026, 7, 1),
                        null,
                        "커리큘럼 샘플 / Sample curriculum",
                        "Level 1에서 가르치는 내용",
                        "Level 1 과정의 기본 리듬, 연결, 대표 패턴 범위",
                        """
                                Level 1은 처음 스윙댄스를 접하는 사람이 소셜댄스에 참여할 수 있도록 돕는 과정입니다.

                                핵심 내용:
                                - 바운스와 기본 리듬
                                - 리더/팔로워 역할 이해
                                - basic step
                                - tuck turn
                                - pass by
                                """,
                        "level1, 커리큘럼, 초급",
                        "What Level 1 Covers",
                        "Basic rhythm, connection, and representative patterns covered in Level 1",
                        """
                                Level 1 helps first-time swing dancers join social dancing comfortably.

                                Core content:
                                - bounce and basic rhythm
                                - leader/follower role awareness
                                - basic step
                                - tuck turn
                                - pass by
                                """,
                        "level1, curriculum, beginner"
                ),
                new SampleItem(
                        "venue-rule",
                        60,
                        LocalDate.of(2026, 6, 9),
                        LocalDate.of(2026, 7, 1),
                        null,
                        "장소 운영 샘플 / Sample venue policy",
                        "댄스홀 입장료 정책",
                        "댄스홀 이용 시 입장료 안내와 예외 처리 기준",
                        """
                                댄스홀 입장료는 공간 운영 정책에 따라 사전에 공지합니다.

                                안내 기준:
                                - 수업료에 포함되는지 별도 결제인지 명확히 표시
                                - 현장 결제 가능 여부 안내
                                - 외부 방문자의 소셜 입장료 별도 안내
                                """,
                        "입장료, 장소, 댄스홀",
                        "Dance Hall Entrance Fee Policy",
                        "How to announce entrance fees and handle exceptions for dance hall use",
                        """
                                Dance hall entrance fees should be announced in advance according to venue policy.

                                Notice guidelines:
                                - clearly state whether the fee is included in class tuition or paid separately
                                - explain whether on-site payment is available
                                - separately explain social entrance fees for external visitors
                                """,
                        "entrance fee, venue, dance hall"
                )
        );
    }

    private record SampleCategory(
            String key,
            Integer displayOrder,
            String koName,
            String koDescription,
            String enName,
            String enDescription
    ) {
    }

    private record SampleItem(
            String categoryKey,
            Integer displayOrder,
            LocalDate decisionDate,
            LocalDate effectiveFrom,
            LocalDate effectiveTo,
            String sourceNote,
            String koTitle,
            String koSummary,
            String koContent,
            String koTags,
            String enTitle,
            String enSummary,
            String enContent,
            String enTags
    ) {
    }
}
