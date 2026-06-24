package com.lindyhopseoul.backend.eventmanagement;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LessonNoticeRepository extends JpaRepository<LessonNotice, Long> {

    List<LessonNotice> findByLesson_IdOrderByCreatedAtAscIdAsc(Long lessonId);

    @Query("""
            select notice
            from LessonNotice notice
            where notice.lesson.id in :lessonIds
            order by notice.lesson.id asc, notice.createdAt desc, notice.id desc
            """)
    List<LessonNotice> findLatestCandidatesByLessonIds(@Param("lessonIds") Collection<Long> lessonIds);
}
