package com.lindyhopseoul.backend.membermessage;

import java.time.Instant;

import com.lindyhopseoul.backend.member.Member;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "member_message")
public class MemberMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "thread_id", nullable = false)
    private MemberMessageThread thread;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_member_id")
    private Member senderMember;

    @Column(name = "sender_admin_id", length = 36)
    private String senderAdminId;

    @Column(name = "sender_admin_display_name", length = 100)
    private String senderAdminDisplayName;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false, length = 20)
    private MemberMessageSenderType senderType;

    @Lob
    @Column(name = "content", nullable = false, length = 2000)
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected MemberMessage() {
    }

    public static MemberMessage create(
            MemberMessageThread thread,
            Member senderMember,
            MemberMessageSenderType senderType,
            String content,
            Instant createdAt
    ) {
        return create(thread, senderMember, null, null, senderType, content, createdAt);
    }

    public static MemberMessage createAdmin(
            MemberMessageThread thread,
            String senderAdminId,
            String senderAdminDisplayName,
            String content,
            Instant createdAt
    ) {
        return create(
                thread,
                null,
                senderAdminId,
                senderAdminDisplayName,
                MemberMessageSenderType.ADMIN,
                content,
                createdAt
        );
    }

    private static MemberMessage create(
            MemberMessageThread thread,
            Member senderMember,
            String senderAdminId,
            String senderAdminDisplayName,
            MemberMessageSenderType senderType,
            String content,
            Instant createdAt
    ) {
        MemberMessage message = new MemberMessage();
        message.thread = thread;
        message.senderMember = senderMember;
        message.senderAdminId = senderAdminId;
        message.senderAdminDisplayName = senderAdminDisplayName;
        message.senderType = senderType;
        message.content = content;
        message.createdAt = createdAt;
        return message;
    }

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public MemberMessageThread getThread() {
        return thread;
    }

    public Member getSenderMember() {
        return senderMember;
    }

    public String getSenderAdminId() {
        return senderAdminId;
    }

    public String getSenderAdminDisplayName() {
        return senderAdminDisplayName;
    }

    public MemberMessageSenderType getSenderType() {
        return senderType;
    }

    public String getContent() {
        return content;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
