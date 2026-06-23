package com.lindyhopseoul.backend.eventmanagement;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EventApplicationRepository extends JpaRepository<EventApplication, Long> {

    List<EventApplication> findByLesson_IdInOrderByCreatedAtAscIdAsc(Collection<Long> lessonIds);

    List<EventApplication> findByMember_IdOrderByCreatedAtDescIdDesc(Long memberId);

    @Query("""
            select count(application)
            from EventApplication application
            where application.member.id = :memberId
              and application.event.id = :eventId
              and (
                    (:lessonId is null and application.lesson is null)
                    or application.lesson.id = :lessonId
              )
            """)
    long countByMemberIdAndApplicationTarget(
            @Param("memberId") Long memberId,
            @Param("eventId") Long eventId,
            @Param("lessonId") Long lessonId
    );
}
