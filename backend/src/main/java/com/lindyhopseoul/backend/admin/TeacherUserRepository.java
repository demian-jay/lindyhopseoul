package com.lindyhopseoul.backend.admin;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TeacherUserRepository extends JpaRepository<TeacherUser, String> {

    Optional<TeacherUser> findFirstByUserAccount_UserIdOrderByTeacherUserNmAsc(String userId);

    Optional<TeacherUser> findFirstByUserAccount_UserIdAndUseYnOrderByTeacherUserNmAsc(String userId, String useYn);

    @Query("""
            select distinct teacher from TeacherUser teacher
            join fetch teacher.userAccount account
            join account.roles userRole
            where userRole.roleCode = com.lindyhopseoul.backend.admin.AdminRole.TEACHER
            order by teacher.teacherUserNm asc
            """)
    List<TeacherUser> findTeacherRoleProfiles();

    @Query("""
            select distinct teacher from TeacherUser teacher
            join fetch teacher.userAccount account
            join account.roles userRole
            where teacher.useYn = 'Y'
              and account.useYn = 'Y'
              and userRole.roleCode = com.lindyhopseoul.backend.admin.AdminRole.TEACHER
            order by teacher.teacherUserNm asc
            """)
    List<TeacherUser> findActiveTeacherRoleProfiles();
}
