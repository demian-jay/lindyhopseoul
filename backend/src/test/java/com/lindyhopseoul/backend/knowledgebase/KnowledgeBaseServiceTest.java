package com.lindyhopseoul.backend.knowledgebase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.lindyhopseoul.backend.admin.AdminLanguage;
import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminRole;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class KnowledgeBaseServiceTest {

    @Mock
    private KnowledgeCategoryRepository categoryRepository;

    @Mock
    private KnowledgeItemRepository itemRepository;

    @InjectMocks
    private KnowledgeBaseService knowledgeBaseService;

    @Test
    void bootstrapLoadsCategoriesAndPublishedItems() {
        KnowledgeCategory category = KnowledgeCategory.create(10);
        category.replaceTranslations(java.util.Set.of(
                new KnowledgeCategoryTranslation("ko", "수업 정책", "수업 정책 설명"),
                new KnowledgeCategoryTranslation("en", "Class Policy", "Class policy description")
        ));
        KnowledgeItem item = KnowledgeItem.create(
                category,
                KnowledgeItemStatus.PUBLISHED,
                10,
                LocalDate.of(2026, 6, 1),
                LocalDate.of(2026, 6, 1),
                null,
                "회의록"
        );
        item.replaceTranslations(java.util.Set.of(
                new KnowledgeItemTranslation("ko", "Level 1 수업 가격", "Level 1 가격 요약", "Level 1 가격 본문", "level1, 가격"),
                new KnowledgeItemTranslation("en", "Level 1 Class Price", "Level 1 price summary", "Level 1 price content", "level1, price")
        ));
        when(categoryRepository.findAllWithTranslations()).thenReturn(List.of(category));
        when(itemRepository.findByStatusWithCategory(KnowledgeItemStatus.PUBLISHED)).thenReturn(List.of(item));

        KnowledgeBaseBootstrapResponse response = knowledgeBaseService.bootstrap();

        assertThat(response.categories()).hasSize(1);
        assertThat(response.items()).hasSize(1);
        assertThat(response.defaultLanguage()).isEqualTo("ko");
        assertThat(response.supportedLanguages()).containsExactly("ko", "en");
        assertThat(response.items().get(0).translations().get("ko").tags()).containsExactly("level1", "가격");
        assertThat(response.items().get(0).translations().get("en").tags()).containsExactly("level1", "price");
        verify(itemRepository).findByStatusWithCategory(KnowledgeItemStatus.PUBLISHED);
    }

    @Test
    void teacherCannotCreateCategory() {
        AdminPrincipal teacher = new AdminPrincipal(
                "T1",
                "Teacher",
                "teacher",
                AdminRole.TEACHER,
                AdminLanguage.Kor
        );

        assertThatThrownBy(() -> knowledgeBaseService.createCategory(
                teacher,
                new KnowledgeCategoryRequest(
                        10,
                        Map.of(
                                "ko",
                                new KnowledgeCategoryRequest.KnowledgeCategoryTranslationRequest("강사 업무", "강사 업무 설명"),
                                "en",
                                new KnowledgeCategoryRequest.KnowledgeCategoryTranslationRequest("Teacher Work", "Teacher work description")
                        )
                )
        )).isInstanceOf(ForbiddenException.class);
    }
}
