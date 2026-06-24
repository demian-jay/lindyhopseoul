package com.lindyhopseoul.backend.eventmanagement;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LessonNoticeReadStateRepository extends JpaRepository<LessonNoticeReadState, Long> {

    Optional<LessonNoticeReadState> findByLesson_IdAndMember_Id(Long lessonId, Long memberId);

    List<LessonNoticeReadState> findByMember_IdAndLesson_IdIn(Long memberId, Collection<Long> lessonIds);
}
