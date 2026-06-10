package com.lindyhopseoul.backend.knowledgebase;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface KnowledgeCategoryRepository extends JpaRepository<KnowledgeCategory, Long> {

    @Query("""
            select distinct category from KnowledgeCategory category
            left join fetch category.translations
            order by category.displayOrder asc, category.id asc
            """)
    List<KnowledgeCategory> findAllWithTranslations();
}
