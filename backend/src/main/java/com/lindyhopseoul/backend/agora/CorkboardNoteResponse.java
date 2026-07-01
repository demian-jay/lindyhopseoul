package com.lindyhopseoul.backend.agora;

import java.time.Instant;

public record CorkboardNoteResponse(
        Long id,
        Long boardId,
        CorkboardNoteType noteType,
        String stickerTemplateKey,
        String content,
        int slotIndex,
        Double positionX,
        Double positionY,
        Double rotationDeg,
        Integer zIndex,
        CorkboardNotePlacementMode placementMode,
        boolean hidden,
        String authorNicknameSnapshot,
        String authorNameSnapshot,
        Instant createdAt,
        Instant updatedAt,
        Instant contentEditedAt,
        boolean deleted,
        boolean positionEditable,
        boolean contentEditable,
        boolean deletable
) {

    public static CorkboardNoteResponse from(CorkboardNote note) {
        return from(note, false);
    }

    public static CorkboardNoteResponse from(CorkboardNote note, boolean memberEditable) {
        Corkboard board = note.getBoard();
        return new CorkboardNoteResponse(
                note.getId(),
                board == null ? null : board.getId(),
                note.getNoteType(),
                note.getStickerTemplateKey(),
                note.getContent(),
                note.getSlotIndex(),
                note.getPositionX(),
                note.getPositionY(),
                note.getRotationDeg(),
                note.getZIndex(),
                note.getPlacementMode(),
                note.isHidden(),
                note.getAuthorNicknameSnapshot(),
                note.getAuthorNameSnapshot(),
                note.getCreatedAt(),
                note.getUpdatedAt(),
                note.getContentEditedAt(),
                note.isDeleted(),
                memberEditable,
                memberEditable,
                memberEditable
        );
    }
}
