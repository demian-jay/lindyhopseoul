package com.lindyhopseoul.backend.operationcheck;

import java.time.Instant;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.UserAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "operation_check_item")
public class OperationCheckItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(nullable = false, length = 36)
    private String createdByUserId;

    @Column(nullable = false, length = 100)
    private String createdByName;

    @Column(length = 36)
    private String assignedToUserId;

    @Column(length = 100)
    private String assignedToName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "varchar(20)")
    private OperationCheckStatus status = OperationCheckStatus.OPEN;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean checkedYn = false;

    @Column(length = 36)
    private String checkedByUserId;

    @Column(length = 100)
    private String checkedByName;

    @Column(length = 1000)
    private String checkedMemo;

    private Instant checkedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected OperationCheckItem() {
    }

    public static OperationCheckItem create(String content, AdminPrincipal actor, UserAccount assignedTo) {
        OperationCheckItem item = new OperationCheckItem();
        item.content = content;
        item.createdByUserId = actor.userCd();
        item.createdByName = actor.userNm();
        if (assignedTo != null) {
            item.assignedToUserId = assignedTo.getUserId();
            item.assignedToName = assignedTo.getName();
        }
        return item;
    }

    public void markDone(AdminPrincipal actor, String checkedMemo) {
        this.status = OperationCheckStatus.DONE;
        this.checkedYn = true;
        this.checkedByUserId = actor.userCd();
        this.checkedByName = actor.userNm();
        this.checkedMemo = checkedMemo;
        this.checkedAt = Instant.now();
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getContent() {
        return content;
    }

    public String getCreatedByUserId() {
        return createdByUserId;
    }

    public String getCreatedByName() {
        return createdByName;
    }

    public String getAssignedToUserId() {
        return assignedToUserId;
    }

    public String getAssignedToName() {
        return assignedToName;
    }

    public OperationCheckStatus getStatus() {
        return status;
    }

    public boolean isCheckedYn() {
        return checkedYn;
    }

    public String getCheckedByUserId() {
        return checkedByUserId;
    }

    public String getCheckedByName() {
        return checkedByName;
    }

    public String getCheckedMemo() {
        return checkedMemo;
    }

    public Instant getCheckedAt() {
        return checkedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
