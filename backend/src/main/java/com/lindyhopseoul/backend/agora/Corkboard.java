package com.lindyhopseoul.backend.agora;

import java.time.Instant;
import java.time.LocalDate;

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
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "corkboard",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_corkboard_period_page",
                columnNames = {"period_key", "page_no"}
        )
)
public class Corkboard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "period_key", nullable = false, length = 7)
    private String periodKey;

    @Column(name = "title", nullable = false, length = 120)
    private String title;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "page_no", nullable = false)
    private int pageNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CorkboardStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Corkboard() {
    }

    public static Corkboard create(String periodKey, String title, LocalDate periodStart, LocalDate periodEnd, int pageNo) {
        Corkboard corkboard = new Corkboard();
        corkboard.periodKey = periodKey;
        corkboard.title = title;
        corkboard.periodStart = periodStart;
        corkboard.periodEnd = periodEnd;
        corkboard.pageNo = pageNo;
        corkboard.status = CorkboardStatus.ACTIVE;
        return corkboard;
    }

    public void archive() {
        this.status = CorkboardStatus.ARCHIVED;
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (status == null) {
            status = CorkboardStatus.ACTIVE;
        }
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getPeriodKey() {
        return periodKey;
    }

    public String getTitle() {
        return title;
    }

    public LocalDate getPeriodStart() {
        return periodStart;
    }

    public LocalDate getPeriodEnd() {
        return periodEnd;
    }

    public int getPageNo() {
        return pageNo;
    }

    public CorkboardStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
