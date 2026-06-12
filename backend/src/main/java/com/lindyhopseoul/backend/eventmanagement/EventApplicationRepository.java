package com.lindyhopseoul.backend.eventmanagement;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EventApplicationRepository extends JpaRepository<EventApplication, Long> {

    List<EventApplication> findByLesson_IdInOrderByCreatedAtAscIdAsc(Collection<Long> lessonIds);
}
