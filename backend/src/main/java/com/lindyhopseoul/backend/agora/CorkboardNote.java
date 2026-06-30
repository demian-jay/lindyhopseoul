package com.lindyhopseoul.backend.agora;

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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "corkboard_note",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_corkboard_note_board_slot",
                columnNames = {"board_id", "slot_index"}
        )
)
public class CorkboardNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "board_id", nullable = false)
    private Corkboard board;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(name = "note_type", nullable = false, length = 20)
    private CorkboardNoteType noteType;

    @Column(name = "sticker_template_key", nullable = false, length = 40)
    private String stickerTemplateKey;

    @Lob
    @Column(name = "content", nullable = false, length = 200)
    private String content;

    @Column(name = "slot_index", nullable = false)
    private int slotIndex;

    @Column(name = "position_x")
    private Double positionX;

    @Column(name = "position_y")
    private Double positionY;

    @Column(name = "rotation_deg")
    private Double rotationDeg;

    @Column(name = "z_index")
    private Integer zIndex;

    @Enumerated(EnumType.STRING)
    @Column(name = "placement_mode", length = 20)
    private CorkboardNotePlacementMode placementMode;

    @Column(name = "hidden", nullable = false)
    private boolean hidden;

    @Column(name = "author_nickname_snapshot", length = 40)
    private String authorNicknameSnapshot;

    @Column(name = "author_name_snapshot", length = 100)
    private String authorNameSnapshot;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CorkboardNote() {
    }

    public static CorkboardNote createMemberNote(
            Corkboard board,
            Member member,
            String stickerTemplateKey,
            String content,
            int slotIndex
    ) {
        CorkboardNote note = create(
                board,
                member,
                CorkboardNoteType.MEMBER,
                stickerTemplateKey,
                content,
                slotIndex,
                null
        );
        note.authorNicknameSnapshot = trimToLength(member == null ? null : member.getNickname(), 40);
        note.authorNameSnapshot = trimToLength(member == null ? null : member.getDisplayName(), 100);
        return note;
    }

    public static CorkboardNote createMemberNote(
            Corkboard board,
            Member member,
            String stickerTemplateKey,
            String content,
            int slotIndex,
            Placement placement
    ) {
        CorkboardNote note = create(
                board,
                member,
                CorkboardNoteType.MEMBER,
                stickerTemplateKey,
                content,
                slotIndex,
                placement
        );
        note.authorNicknameSnapshot = trimToLength(member == null ? null : member.getNickname(), 40);
        note.authorNameSnapshot = trimToLength(member == null ? null : member.getDisplayName(), 100);
        return note;
    }

    public static CorkboardNote createOfficialNote(
            Corkboard board,
            String authorName,
            String stickerTemplateKey,
            String content,
            int slotIndex
    ) {
        CorkboardNote note = create(
                board,
                null,
                CorkboardNoteType.OFFICIAL,
                stickerTemplateKey,
                content,
                slotIndex,
                null
        );
        note.authorNameSnapshot = trimToLength(authorName, 100);
        return note;
    }

    public static CorkboardNote createOfficialNote(
            Corkboard board,
            String authorName,
            String stickerTemplateKey,
            String content,
            int slotIndex,
            Placement placement
    ) {
        CorkboardNote note = create(
                board,
                null,
                CorkboardNoteType.OFFICIAL,
                stickerTemplateKey,
                content,
                slotIndex,
                placement
        );
        note.authorNameSnapshot = trimToLength(authorName, 100);
        return note;
    }

    private static CorkboardNote create(
            Corkboard board,
            Member member,
            CorkboardNoteType noteType,
            String stickerTemplateKey,
            String content,
            int slotIndex,
            Placement placement
    ) {
        CorkboardNote note = new CorkboardNote();
        note.board = board;
        note.member = member;
        note.noteType = noteType;
        note.stickerTemplateKey = stickerTemplateKey;
        note.content = content;
        note.slotIndex = slotIndex;
        if (placement != null) {
            note.positionX = placement.positionX();
            note.positionY = placement.positionY();
            note.rotationDeg = placement.rotationDeg();
            note.zIndex = placement.zIndex();
            note.placementMode = placement.placementMode();
        } else {
            note.placementMode = CorkboardNotePlacementMode.SLOT;
        }
        note.hidden = false;
        return note;
    }

    public void setHidden(boolean hidden) {
        this.hidden = hidden;
    }

    public void updatePlacement(Placement placement) {
        if (placement == null) {
            return;
        }
        positionX = placement.positionX();
        positionY = placement.positionY();
        rotationDeg = placement.rotationDeg();
        zIndex = placement.zIndex();
        placementMode = placement.placementMode();
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    private static String trimToLength(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String normalized = value.strip();
        if (normalized.isBlank()) {
            return null;
        }
        return normalized.length() <= maxLength ? normalized : normalized.substring(0, maxLength);
    }

    public Long getId() {
        return id;
    }

    public Corkboard getBoard() {
        return board;
    }

    public Member getMember() {
        return member;
    }

    public CorkboardNoteType getNoteType() {
        return noteType;
    }

    public String getStickerTemplateKey() {
        return stickerTemplateKey;
    }

    public String getContent() {
        return content;
    }

    public int getSlotIndex() {
        return slotIndex;
    }

    public Double getPositionX() {
        return positionX;
    }

    public Double getPositionY() {
        return positionY;
    }

    public Double getRotationDeg() {
        return rotationDeg;
    }

    public Integer getZIndex() {
        return zIndex;
    }

    public CorkboardNotePlacementMode getPlacementMode() {
        return placementMode == null ? CorkboardNotePlacementMode.SLOT : placementMode;
    }

    public boolean isHidden() {
        return hidden;
    }

    public String getAuthorNicknameSnapshot() {
        return authorNicknameSnapshot;
    }

    public String getAuthorNameSnapshot() {
        return authorNameSnapshot;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public record Placement(
            Double positionX,
            Double positionY,
            Double rotationDeg,
            Integer zIndex,
            CorkboardNotePlacementMode placementMode
    ) {
    }
}
