package com.lindyhopseoul.backend.eventmanagement;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "LESSON_NOTICE")
public class LessonNotice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "LESSON_ID", nullable = false)
    private Lesson lesson;

    @Lob
    @Column(nullable = false, length = 2000)
    private String content;

    @Column(length = 36)
    private String authorAdminId;

    @Column(length = 100)
    private String authorNicknameSnapshot;

    @Column(length = 100)
    private String authorDisplayNameSnapshot;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected LessonNotice() {
    }

    public static LessonNotice create(
            Lesson lesson,
            String content,
            String authorAdminId,
            String authorNicknameSnapshot,
            String authorDisplayNameSnapshot
    ) {
        LessonNotice notice = new LessonNotice();
        notice.lesson = lesson;
        notice.content = content;
        notice.authorAdminId = authorAdminId;
        notice.authorNicknameSnapshot = authorNicknameSnapshot;
        notice.authorDisplayNameSnapshot = authorDisplayNameSnapshot;
        return notice;
    }

    public void updateContent(String content) {
        this.content = content;
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

    public Lesson getLesson() {
        return lesson;
    }

    public String getContent() {
        return content;
    }

    public String getAuthorAdminId() {
        return authorAdminId;
    }

    public String getAuthorNicknameSnapshot() {
        return authorNicknameSnapshot;
    }

    public String getAuthorDisplayNameSnapshot() {
        return authorDisplayNameSnapshot;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
