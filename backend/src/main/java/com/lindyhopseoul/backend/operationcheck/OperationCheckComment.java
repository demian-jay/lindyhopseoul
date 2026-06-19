package com.lindyhopseoul.backend.operationcheck;

import java.time.Instant;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "operation_check_comment")
public class OperationCheckComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "operation_check_item_id", nullable = false)
    private OperationCheckItem item;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(nullable = false, length = 36)
    private String createdByUserId;

    @Column(nullable = false, length = 100)
    private String createdByName;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean deletedYn = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected OperationCheckComment() {
    }

    public static OperationCheckComment create(OperationCheckItem item, String content, AdminPrincipal actor) {
        OperationCheckComment comment = new OperationCheckComment();
        comment.item = item;
        comment.content = content;
        comment.createdByUserId = actor.userCd();
        comment.createdByName = actor.userNm();
        return comment;
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

    public OperationCheckItem getItem() {
        return item;
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

    public boolean isDeletedYn() {
        return deletedYn;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
