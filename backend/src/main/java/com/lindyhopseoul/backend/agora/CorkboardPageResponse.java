package com.lindyhopseoul.backend.agora;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record CorkboardPageResponse(
        Long id,
        String periodKey,
        String title,
        LocalDate periodStart,
        LocalDate periodEnd,
        int pageNo,
        CorkboardStatus status,
        boolean readOnly,
        Instant createdAt,
        Instant updatedAt,
        List<CorkboardNoteResponse> notes
) {

    public static CorkboardPageResponse from(Corkboard board, List<CorkboardNoteResponse> notes, boolean readOnly) {
        return new CorkboardPageResponse(
                board.getId(),
                board.getPeriodKey(),
                board.getTitle(),
                board.getPeriodStart(),
                board.getPeriodEnd(),
                board.getPageNo(),
                board.getStatus(),
                readOnly,
                board.getCreatedAt(),
                board.getUpdatedAt(),
                notes
        );
    }
}
