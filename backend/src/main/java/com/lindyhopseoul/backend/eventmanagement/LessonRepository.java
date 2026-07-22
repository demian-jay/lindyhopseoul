package com.lindyhopseoul.backend.eventmanagement;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LessonRepository extends JpaRepository<Lesson, Long> {

    @Query("""
            select distinct lesson from Lesson lesson
            left join fetch lesson.translations
            left join fetch lesson.teachers lessonTeachers
            left join fetch lessonTeachers.teacherUser
            where lesson.event.id = :eventId
            order by lesson.displayOrder asc, lesson.id asc
            """)
    List<Lesson> findByEventIdWithDetails(@Param("eventId") Long eventId);

    // For the day-before reminder: lessons starting on a given date, with the
    // teacher accounts fetched so the scheduler can resolve recipients without a
    // session held open.
    @Query("""
            select distinct lesson from Lesson lesson
            left join fetch lesson.translations
            left join fetch lesson.teachers lessonTeachers
            left join fetch lessonTeachers.teacherUser teacherUser
            left join fetch teacherUser.userAccount
            where lesson.startDate = :startDate
              and lesson.status = :status
            """)
    List<Lesson> findForReminder(@Param("startDate") LocalDate startDate, @Param("status") LessonStatus status);

    @Query("""
            select distinct lesson from Lesson lesson
            left join fetch lesson.event event
            left join fetch event.translations
            left join fetch lesson.translations
            left join fetch lesson.teachers lessonTeachers
            left join fetch lessonTeachers.teacherUser
            where lesson.id = :id
            """)
    Optional<Lesson> findDetailsById(@Param("id") Long id);

    /**
     * Every lesson in a date range, whoever teaches it. Backs the lesson-first
     * 강습조회 screen, which lists lessons rather than walking events one at a
     * time to reach them.
     */
    @Query("""
            select distinct lesson from Lesson lesson
            left join fetch lesson.event event
            left join fetch event.translations
            left join fetch lesson.translations
            left join fetch lesson.teachers lessonTeachers
            left join fetch lessonTeachers.teacherUser
            where (:from is null or lesson.endDate >= :from)
              and (:to is null or lesson.startDate <= :to)
              and (:status is null or lesson.status = :status)
            order by lesson.startDate asc, event.displayOrder asc, lesson.displayOrder asc, lesson.startTime asc, lesson.id asc
            """)
    List<Lesson> findLessonsInRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("status") LessonStatus status
    );

    @Query("""
            select distinct lesson from Lesson lesson
            join lesson.teachers assignedTeacher
            left join fetch lesson.event event
            left join fetch event.translations
            left join fetch lesson.translations
            left join fetch lesson.teachers lessonTeachers
            left join fetch lessonTeachers.teacherUser
            where assignedTeacher.teacherUser.teacherUserCd = :teacherUserId
              and lesson.status = :status
              and (:from is null or lesson.endDate >= :from)
              and (:to is null or lesson.startDate <= :to)
            order by lesson.startDate asc, event.displayOrder asc, lesson.displayOrder asc, lesson.startTime asc, lesson.id asc
            """)
    List<Lesson> findTeacherLessons(
            @Param("teacherUserId") String teacherUserId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("status") LessonStatus status
    );

    @Query("""
            select distinct lesson from Lesson lesson
            join lesson.teachers assignedTeacher
            left join fetch lesson.event event
            left join fetch event.translations
            left join fetch lesson.translations
            left join fetch lesson.teachers lessonTeachers
            left join fetch lessonTeachers.teacherUser
            where assignedTeacher.teacherUser.teacherUserCd = :teacherUserId
              and lesson.status = com.lindyhopseoul.backend.eventmanagement.LessonStatus.PUBLISHED
              and lesson.endDate >= :today
            order by lesson.startDate asc, event.displayOrder asc, lesson.displayOrder asc, lesson.startTime asc, lesson.id asc
            """)
    List<Lesson> findActiveTeacherLessons(
            @Param("teacherUserId") String teacherUserId,
            @Param("today") LocalDate today
    );
}
