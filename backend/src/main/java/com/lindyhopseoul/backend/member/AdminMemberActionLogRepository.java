package com.lindyhopseoul.backend.member;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdminMemberActionLogRepository extends JpaRepository<AdminMemberActionLog, Long> {

    @Query("""
            select log
            from AdminMemberActionLog log
            where (:fromAt is null or log.actionAt >= :fromAt)
              and (:toAt is null or log.actionAt < :toAt)
              and (:actorAdminId is null or log.actorAdminId = :actorAdminId)
              and (:targetMemberId is null or log.targetMemberId = :targetMemberId)
              and (:action is null or log.action = :action)
              and (:lessonId is null or log.lessonId = :lessonId)
              and (:targetMemberStatus is null or log.targetMemberStatus = :targetMemberStatus)
            order by log.actionAt desc, log.id desc
            """)
    List<AdminMemberActionLog> search(
            @Param("fromAt") Instant from,
            @Param("toAt") Instant to,
            @Param("actorAdminId") String actorAdminId,
            @Param("targetMemberId") Long targetMemberId,
            @Param("action") AdminMemberActionType action,
            @Param("lessonId") Long lessonId,
            @Param("targetMemberStatus") MemberStatus targetMemberStatus
    );
}
