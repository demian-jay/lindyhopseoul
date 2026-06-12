package com.lindyhopseoul.backend.eventmanagement;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EventRepository extends JpaRepository<Event, Long> {

    boolean existsByEventType(EventType eventType);

    @Query("""
            select distinct event from Event event
            left join fetch event.translations
            where (:from is null or event.endDate >= :from)
              and (:to is null or event.startDate <= :to)
              and (:eventType is null or event.eventType = :eventType)
              and (:status is null or event.status = :status)
            order by event.startDate asc, event.displayOrder asc, event.id asc
            """)
    List<Event> search(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("eventType") EventType eventType,
            @Param("status") EventStatus status
    );

    @Query("""
            select distinct event from Event event
            left join fetch event.translations
            left join fetch event.lessons lessons
            left join fetch lessons.translations
            left join fetch lessons.teachers lessonTeachers
            left join fetch lessonTeachers.teacherUser
            where event.id = :id
            """)
    Optional<Event> findDetailsById(@Param("id") Long id);

    @Query("""
            select distinct event from Event event
            left join fetch event.translations
            left join fetch event.lessons lessons
            left join fetch lessons.translations
            left join fetch lessons.teachers lessonTeachers
            left join fetch lessonTeachers.teacherUser
            where event.status = com.lindyhopseoul.backend.eventmanagement.EventStatus.PUBLISHED
              and event.endDate >= :from
              and (:to is null or event.startDate <= :to)
            order by event.startDate asc, event.displayOrder asc, event.id asc
            """)
    List<Event> findPublishedDetails(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );
}
