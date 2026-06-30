package com.lindyhopseoul.backend.agora;

import java.time.Instant;

public record CorkboardNoteResponse(
        Long id,
        Long boardId,
        CorkboardNoteType noteType,
        String stickerTemplateKey,
        String content,
        int slotIndex,
        boolean hidden,
        String authorNicknameSnapshot,
        String authorNameSnapshot,
        Instant createdAt,
        Instant updatedAt
) {

    public static CorkboardNoteResponse from(CorkboardNote note) {
        Corkboard board = note.getBoard();
        return new CorkboardNoteResponse(
                note.getId(),
                board == null ? null : board.getId(),
                note.getNoteType(),
                note.getStickerTemplateKey(),
                note.getContent(),
                note.getSlotIndex(),
                note.isHidden(),
                note.getAuthorNicknameSnapshot(),
                note.getAuthorNameSnapshot(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}
