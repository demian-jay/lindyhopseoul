package com.lindyhopseoul.backend.eventmanagement;

import com.lindyhopseoul.backend.admin.TeacherUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "LESSON_TEACHER")
public class LessonTeacher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "LESSON_ID", nullable = false)
    private Lesson lesson;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "TEACHER_USER_ID", referencedColumnName = "TEACHER_USER_CD", nullable = false)
    private TeacherUser teacherUser;

    @Column(nullable = false, length = 40)
    private String role;

    @Column(nullable = false)
    private Integer displayOrder;

    protected LessonTeacher() {
    }

    public LessonTeacher(TeacherUser teacherUser, String role, Integer displayOrder) {
        this.teacherUser = teacherUser;
        this.role = role;
        this.displayOrder = displayOrder;
    }

    public void assignLesson(Lesson lesson) {
        this.lesson = lesson;
    }

    public Long getId() {
        return id;
    }

    public TeacherUser getTeacherUser() {
        return teacherUser;
    }

    public String getRole() {
        return role;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }
}
