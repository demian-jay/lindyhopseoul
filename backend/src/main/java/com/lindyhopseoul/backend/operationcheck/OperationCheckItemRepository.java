package com.lindyhopseoul.backend.operationcheck;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationCheckItemRepository extends JpaRepository<OperationCheckItem, Long> {

    List<OperationCheckItem> findAllByOrderByCreatedAtDesc();

    List<OperationCheckItem> findByStatusOrderByCreatedAtDesc(OperationCheckStatus status);

    long countByStatus(OperationCheckStatus status);

    long countByStatusAndAssignedToUserId(OperationCheckStatus status, String assignedToUserId);
}
