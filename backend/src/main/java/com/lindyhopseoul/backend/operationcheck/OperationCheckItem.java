package com.lindyhopseoul.backend.operationcheck;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.UserAccount;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
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

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<OperationCheckAssignee> assignees = new ArrayList<>();

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

    public static OperationCheckItem create(String content, AdminPrincipal actor, Collection<UserAccount> assignees) {
        OperationCheckItem item = new OperationCheckItem();
        item.content = content;
        item.createdByUserId = actor.userCd();
        item.createdByName = actor.userNm();
        item.replaceAssignees(assignees);
        return item;
    }

    public void update(String content, Collection<UserAccount> nextAssignees) {
        this.content = content;
        replaceAssignees(nextAssignees);
    }

    public void replaceAssignees(Collection<UserAccount> nextAssignees) {
        // Desired assignees, de-duplicated by user id with order preserved.
        java.util.Map<String, UserAccount> desired = new java.util.LinkedHashMap<>();
        if (nextAssignees != null) {
            for (UserAccount user : nextAssignees) {
                if (user != null && user.getUserId() != null) {
                    desired.putIfAbsent(user.getUserId(), user);
                }
            }
        }

        // Diff rather than clear-and-re-add: an assignee that stays is left
        // untouched, so re-saving the same one does not delete-then-reinsert it
        // within one flush — which trips the unique (item, user) constraint
        // because Hibernate can order the insert before the delete.
        assignees.removeIf(assignee -> !desired.containsKey(assignee.getAssigneeUserId()));

        java.util.Set<String> present = new java.util.HashSet<>();
        for (OperationCheckAssignee assignee : assignees) {
            present.add(assignee.getAssigneeUserId());
        }
        desired.forEach((userId, user) -> {
            if (!present.contains(userId)) {
                assignees.add(OperationCheckAssignee.create(this, user));
            }
        });

        // The legacy single-assignee columns mirror the first desired assignee.
        UserAccount first = desired.values().stream().findFirst().orElse(null);
        assignedToUserId = first == null ? null : first.getUserId();
        assignedToName = first == null ? null : first.getName();
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

    public List<OperationCheckAssignee> getAssignees() {
        return assignees.stream()
                .sorted(Comparator.comparing(OperationCheckAssignee::getId, Comparator.nullsLast(Long::compareTo)))
                .toList();
    }

    public boolean hasAssignees() {
        return !assignees.isEmpty() || assignedToUserId != null;
    }

    public boolean isAssignedTo(String userId) {
        if (userId == null) {
            return false;
        }
        return userId.equals(assignedToUserId)
                || assignees.stream().anyMatch(assignee -> userId.equals(assignee.getAssigneeUserId()));
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
