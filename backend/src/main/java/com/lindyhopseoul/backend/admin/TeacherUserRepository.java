package com.lindyhopseoul.backend.admin;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TeacherUserRepository extends JpaRepository<TeacherUser, String> {

    Optional<TeacherUser> findByLoginId(String loginId);

    List<TeacherUser> findByUseYnOrderByTeacherUserNmAsc(String useYn);
}
