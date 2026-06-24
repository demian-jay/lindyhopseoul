package com.lindyhopseoul.backend.membermessage;

import java.time.Instant;

import com.lindyhopseoul.backend.member.Member;
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
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "member_message_thread",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_member_message_thread_member_id",
                columnNames = "member_id"
        )
)
public class MemberMessageThread {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    @Column(name = "admin_last_read_at")
    private Instant adminLastReadAt;

    @Column(name = "member_last_read_at")
    private Instant memberLastReadAt;

    @Column(name = "last_member_message_at")
    private Instant lastMemberMessageAt;

    @Column(name = "last_staff_message_at")
    private Instant lastStaffMessageAt;

    protected MemberMessageThread() {
    }

    public static MemberMessageThread create(Member member, Instant now) {
        MemberMessageThread thread = new MemberMessageThread();
        thread.member = member;
        thread.createdAt = now;
        thread.updatedAt = now;
        return thread;
    }

    public void recordMessage(Instant messageAt) {
        this.lastMessageAt = messageAt;
        this.updatedAt = messageAt;
    }

    public void recordMemberMessage(Instant messageAt) {
        recordMessage(messageAt);
        this.lastMemberMessageAt = messageAt;
    }

    public void recordStaffMessage(Instant messageAt) {
        recordMessage(messageAt);
        this.lastStaffMessageAt = messageAt;
    }

    public void markAdminRead(Instant readAt) {
        this.adminLastReadAt = readAt;
    }

    public void markMemberRead(Instant readAt) {
        this.memberLastReadAt = readAt;
    }

    public boolean isUnreadByAdmin() {
        return isAfter(lastMemberMessageAt, adminLastReadAt);
    }

    public boolean isUnreadByMember() {
        return isAfter(lastStaffMessageAt, memberLastReadAt);
    }

    private boolean isAfter(Instant messageAt, Instant readAt) {
        if (messageAt == null) {
            return false;
        }
        return readAt == null || messageAt.isAfter(readAt);
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Member getMember() {
        return member;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Instant getLastMessageAt() {
        return lastMessageAt;
    }

    public Instant getAdminLastReadAt() {
        return adminLastReadAt;
    }

    public Instant getMemberLastReadAt() {
        return memberLastReadAt;
    }

    public Instant getLastMemberMessageAt() {
        return lastMemberMessageAt;
    }

    public Instant getLastStaffMessageAt() {
        return lastStaffMessageAt;
    }
}
