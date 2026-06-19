package com.lindyhopseoul.backend.operationcheck;

import java.time.Instant;

import com.lindyhopseoul.backend.admin.UserAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "operation_check_assignee",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_operation_check_assignee_user",
                columnNames = {"operation_check_item_id", "assignee_user_id"}
        )
)
public class OperationCheckAssignee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "operation_check_item_id", nullable = false)
    private OperationCheckItem item;

    @Column(name = "assignee_user_id", nullable = false, length = 36)
    private String assigneeUserId;

    @Column(name = "assignee_name", nullable = false, length = 100)
    private String assigneeName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected OperationCheckAssignee() {
    }

    public static OperationCheckAssignee create(OperationCheckItem item, UserAccount assignee) {
        OperationCheckAssignee assignment = new OperationCheckAssignee();
        assignment.item = item;
        assignment.assigneeUserId = assignee.getUserId();
        assignment.assigneeName = assignee.getName();
        return assignment;
    }

    @PrePersist
    void prePersist() {
        createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public OperationCheckItem getItem() {
        return item;
    }

    public String getAssigneeUserId() {
        return assigneeUserId;
    }

    public String getAssigneeName() {
        return assigneeName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
