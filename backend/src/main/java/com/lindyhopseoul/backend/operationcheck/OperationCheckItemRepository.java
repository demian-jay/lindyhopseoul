package com.lindyhopseoul.backend.operationcheck;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OperationCheckItemRepository extends JpaRepository<OperationCheckItem, Long> {

    List<OperationCheckItem> findAllByOrderByCreatedAtDesc();

    List<OperationCheckItem> findByStatusOrderByCreatedAtDesc(OperationCheckStatus status);

    long countByStatus(OperationCheckStatus status);

    long countByStatusAndAssignedToUserId(OperationCheckStatus status, String assignedToUserId);

    @Query("""
            select count(distinct item)
            from OperationCheckItem item
            left join item.assignees assignee
            where item.status = :status
              and (item.assignedToUserId = :userId or assignee.assigneeUserId = :userId)
            """)
    long countByStatusAssignedToUser(
            @Param("status") OperationCheckStatus status,
            @Param("userId") String userId
    );
}
