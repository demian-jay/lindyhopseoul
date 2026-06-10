package com.lindyhopseoul.backend.knowledgebase;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminRole;
import com.lindyhopseoul.backend.exception.ConflictException;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import com.lindyhopseoul.backend.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class KnowledgeBaseService {

    public static final String DEFAULT_LANGUAGE = "ko";
    public static final List<String> SUPPORTED_LANGUAGES = List.of("ko", "en");

    private final KnowledgeCategoryRepository categoryRepository;
    private final KnowledgeItemRepository itemRepository;

    public KnowledgeBaseService(
            KnowledgeCategoryRepository categoryRepository,
            KnowledgeItemRepository itemRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.itemRepository = itemRepository;
    }

    public KnowledgeBaseBootstrapResponse bootstrap() {
        return new KnowledgeBaseBootstrapResponse(
                DEFAULT_LANGUAGE,
                SUPPORTED_LANGUAGES,
                findCategories(),
                itemRepository.findByStatusWithCategory(KnowledgeItemStatus.PUBLISHED)
                        .stream()
                        .map(KnowledgeItemResponse::from)
                        .toList()
        );
    }

    public List<KnowledgeCategoryResponse> findCategories() {
        return categoryRepository.findAllWithTranslations()
                .stream()
                .map(KnowledgeCategoryResponse::from)
                .toList();
    }

    @Transactional
    public KnowledgeCategoryResponse createCategory(AdminPrincipal actor, KnowledgeCategoryRequest request) {
        requireKnowledgeManager(actor);
        KnowledgeCategory category = KnowledgeCategory.create(request.displayOrder());
        category.replaceTranslations(toCategoryTranslations(request.translations()));
        categoryRepository.save(category);

        return KnowledgeCategoryResponse.from(category);
    }

    @Transactional
    public KnowledgeCategoryResponse updateCategory(AdminPrincipal actor, Long id, KnowledgeCategoryRequest request) {
        requireKnowledgeManager(actor);
        KnowledgeCategory category = findCategory(id);
        category.update(request.displayOrder());
        category.replaceTranslations(toCategoryTranslations(request.translations()));
        return KnowledgeCategoryResponse.from(category);
    }

    @Transactional
    public void deleteCategory(AdminPrincipal actor, Long id) {
        requireKnowledgeManager(actor);
        KnowledgeCategory category = findCategory(id);
        if (itemRepository.existsByCategoryId(id)) {
            throw new ConflictException("Category has knowledge items and cannot be deleted.");
        }
        categoryRepository.delete(category);
    }

    public List<KnowledgeItemResponse> findItems() {
        return itemRepository.findAllWithCategory()
                .stream()
                .map(KnowledgeItemResponse::from)
                .toList();
    }

    public KnowledgeItemResponse findItem(Long id) {
        return KnowledgeItemResponse.from(findItemEntity(id));
    }

    @Transactional
    public KnowledgeItemResponse createItem(AdminPrincipal actor, KnowledgeItemRequest request) {
        requireKnowledgeManager(actor);
        KnowledgeCategory category = findCategory(request.categoryId());
        KnowledgeItem item = KnowledgeItem.create(
                category,
                request.status(),
                request.displayOrder(),
                request.decisionDate(),
                request.effectiveFrom(),
                request.effectiveTo(),
                cleanNullable(request.sourceNote())
        );
        item.replaceTranslations(toItemTranslations(request.translations()));
        itemRepository.save(item);

        return KnowledgeItemResponse.from(item);
    }

    @Transactional
    public KnowledgeItemResponse updateItem(AdminPrincipal actor, Long id, KnowledgeItemRequest request) {
        requireKnowledgeManager(actor);
        KnowledgeItem item = findItemEntity(id);
        KnowledgeCategory category = findCategory(request.categoryId());
        item.update(
                category,
                request.status(),
                request.displayOrder(),
                request.decisionDate(),
                request.effectiveFrom(),
                request.effectiveTo(),
                cleanNullable(request.sourceNote())
        );
        item.replaceTranslations(toItemTranslations(request.translations()));

        return KnowledgeItemResponse.from(item);
    }

    @Transactional
    public void deleteItem(AdminPrincipal actor, Long id) {
        requireKnowledgeManager(actor);
        itemRepository.delete(findItemEntity(id));
    }

    private KnowledgeCategory findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Knowledge category not found: " + id));
    }

    private KnowledgeItem findItemEntity(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Knowledge item not found: " + id));
    }

    private void requireKnowledgeManager(AdminPrincipal actor) {
        if (actor.role() != AdminRole.SUPER_ADMIN && actor.role() != AdminRole.STAFF) {
            throw new ForbiddenException("This account cannot manage the knowledge base.");
        }
    }

    private Set<KnowledgeCategoryTranslation> toCategoryTranslations(
            Map<String, KnowledgeCategoryRequest.KnowledgeCategoryTranslationRequest> translations
    ) {
        requireDefaultLanguage(translations);

        return translations.entrySet()
                .stream()
                .filter(entry -> SUPPORTED_LANGUAGES.contains(entry.getKey()))
                .map(entry -> new KnowledgeCategoryTranslation(
                        entry.getKey(),
                        clean(entry.getValue().name()),
                        cleanNullable(entry.getValue().description())
                ))
                .collect(Collectors.toCollection(java.util.LinkedHashSet::new));
    }

    private Set<KnowledgeItemTranslation> toItemTranslations(
            Map<String, KnowledgeItemRequest.KnowledgeItemTranslationRequest> translations
    ) {
        requireDefaultLanguage(translations);

        return translations.entrySet()
                .stream()
                .filter(entry -> SUPPORTED_LANGUAGES.contains(entry.getKey()))
                .map(entry -> new KnowledgeItemTranslation(
                        entry.getKey(),
                        clean(entry.getValue().title()),
                        clean(entry.getValue().summary()),
                        clean(entry.getValue().content()),
                        joinTags(entry.getValue().tags())
                ))
                .collect(Collectors.toCollection(java.util.LinkedHashSet::new));
    }

    private void requireDefaultLanguage(Map<String, ?> translations) {
        if (translations == null || !translations.containsKey(DEFAULT_LANGUAGE) || translations.get(DEFAULT_LANGUAGE) == null) {
            throw new ConflictException("Default language translation is required.");
        }
    }

    private String joinTags(List<String> tags) {
        if (tags == null) {
            return "";
        }

        return tags.stream()
                .map(this::cleanNullable)
                .filter(tag -> tag != null && !tag.isBlank())
                .distinct()
                .limit(30)
                .reduce((left, right) -> left + ", " + right)
                .orElse("");
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
}
