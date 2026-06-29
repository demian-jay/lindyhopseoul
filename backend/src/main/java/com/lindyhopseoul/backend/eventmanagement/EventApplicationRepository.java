package com.lindyhopseoul.backend.eventmanagement;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EventApplicationRepository extends JpaRepository<EventApplication, Long> {

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
            select distinct application
            from EventApplication application
            join fetch application.member member
            join fetch application.event event
            left join fetch event.translations
            left join fetch application.lesson lesson
            left join fetch lesson.translations
            where (application.status is null or application.status = com.lindyhopseoul.backend.eventmanagement.EventApplicationStatus.ACTIVE)
              and member.status = com.lindyhopseoul.backend.member.MemberStatus.ACTIVE
              and event.status = com.lindyhopseoul.backend.eventmanagement.EventStatus.PUBLISHED
              and event.endDate >= :today
              and (
                    lesson is null
                    or (
                        lesson.status = com.lindyhopseoul.backend.eventmanagement.LessonStatus.PUBLISHED
                        and coalesce(lesson.endDate, event.endDate) >= :today
                    )
              )
            order by application.createdAt desc, application.id desc
            """)
    List<EventApplication> findAgoraParticipantAvatarCandidates(@Param("today") java.time.LocalDate today);

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
