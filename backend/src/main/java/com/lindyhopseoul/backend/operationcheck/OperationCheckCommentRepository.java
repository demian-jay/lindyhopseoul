package com.lindyhopseoul.backend.operationcheck;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationCheckCommentRepository extends JpaRepository<OperationCheckComment, Long> {

    List<OperationCheckComment> findByItem_IdAndDeletedYnFalseOrderByCreatedAtAsc(Long itemId);
}
