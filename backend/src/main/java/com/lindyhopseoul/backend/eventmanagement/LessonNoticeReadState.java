package com.lindyhopseoul.backend.eventmanagement;

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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "LESSON_NOTICE_READ_STATE",
        uniqueConstraints = @UniqueConstraint(
                name = "UK_LESSON_NOTICE_READ_STATE_LESSON_MEMBER",
                columnNames = {"LESSON_ID", "MEMBER_ID"}
        )
)
public class LessonNoticeReadState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "LESSON_ID", nullable = false)
    private Lesson lesson;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "MEMBER_ID", nullable = false)
    private Member member;

    @Column(nullable = false)
    private Instant lastReadAt;

    protected LessonNoticeReadState() {
    }

    public static LessonNoticeReadState create(Lesson lesson, Member member, Instant lastReadAt) {
        LessonNoticeReadState readState = new LessonNoticeReadState();
        readState.lesson = lesson;
        readState.member = member;
        readState.lastReadAt = lastReadAt;
        return readState;
    }

    public void markRead(Instant lastReadAt) {
        this.lastReadAt = lastReadAt;
    }

    public Long getId() {
        return id;
    }

    public Lesson getLesson() {
        return lesson;
    }

    public Member getMember() {
        return member;
    }

    public Instant getLastReadAt() {
        return lastReadAt;
    }
}
