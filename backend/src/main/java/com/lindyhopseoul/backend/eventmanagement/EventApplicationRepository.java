package com.lindyhopseoul.backend.eventmanagement;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EventApplicationRepository extends JpaRepository<EventApplication, Long> {

    // Applications reference lesson/event by FK but are not cascade children, so they
    // must be cleared before an event or lesson is deleted (otherwise FK 1451 fails).
    @Modifying
    @Query("delete from EventApplication application where application.event.id = :eventId")
    void deleteByEventId(@Param("eventId") Long eventId);

    @Modifying
    @Query("delete from EventApplication application where application.lesson.id in :lessonIds")
    void deleteByLessonIdIn(@Param("lessonIds") Collection<Long> lessonIds);

    @Query("""
            select application
            from EventApplication application
            left join fetch application.member
            where application.lesson.id in :lessonIds
              and (application.status is null or application.status = com.lindyhopseoul.backend.eventmanagement.EventApplicationStatus.ACTIVE)
            order by application.createdAt asc, application.id asc
            """)
    List<EventApplication> findByLesson_IdInOrderByCreatedAtAscIdAsc(@Param("lessonIds") Collection<Long> lessonIds);

    @Query("""
            select application
            from EventApplication application
            left join fetch application.event
            left join fetch application.lesson
            where application.member.id = :memberId
              and (application.status is null or application.status = com.lindyhopseoul.backend.eventmanagement.EventApplicationStatus.ACTIVE)
            order by application.createdAt desc, application.id desc
            """)
    List<EventApplication> findByMember_IdOrderByCreatedAtDescIdDesc(@Param("memberId") Long memberId);

    @Query("""
            select application
            from EventApplication application
            left join fetch application.lesson
            where application.member.id in :memberIds
              and (application.status is null or application.status = com.lindyhopseoul.backend.eventmanagement.EventApplicationStatus.ACTIVE)
            """)
    List<EventApplication> findByMemberIdsWithLesson(@Param("memberIds") Collection<Long> memberIds);

    @Query("""
            select count(application)
            from EventApplication application
            where application.member.id = :memberId
              and application.event.id = :eventId
              and (application.status is null or application.status = com.lindyhopseoul.backend.eventmanagement.EventApplicationStatus.ACTIVE)
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
