package com.lindyhopseoul.backend.knowledgebase;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface KnowledgeItemRepository extends JpaRepository<KnowledgeItem, Long> {

    @Query("""
            select distinct item from KnowledgeItem item
            join fetch item.category category
            left join fetch item.translations
            left join fetch category.translations
            order by category.displayOrder asc, item.displayOrder asc, item.id asc
            """)
    List<KnowledgeItem> findAllWithCategory();

    @Query("""
            select distinct item from KnowledgeItem item
            join fetch item.category category
            left join fetch item.translations
            left join fetch category.translations
            where item.status = :status
            order by category.displayOrder asc, item.displayOrder asc, item.id asc
            """)
    List<KnowledgeItem> findByStatusWithCategory(@Param("status") KnowledgeItemStatus status);

    boolean existsByCategoryId(Long categoryId);
}
