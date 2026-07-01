package com.lindyhopseoul.backend.agora;

import java.time.LocalDate;
import java.util.List;

public record CorkboardCollectionResponse(
        String periodKey,
        String title,
        LocalDate periodStart,
        LocalDate periodEnd,
        CorkboardStatus status,
        boolean readOnly,
        List<CorkboardPageResponse> pages,
        boolean replacedExisting,
        Long replacedNoteId
) {

    public CorkboardCollectionResponse(
            String periodKey,
            String title,
            LocalDate periodStart,
            LocalDate periodEnd,
            CorkboardStatus status,
            boolean readOnly,
            List<CorkboardPageResponse> pages
    ) {
        this(periodKey, title, periodStart, periodEnd, status, readOnly, pages, false, null);
    }

    public CorkboardCollectionResponse withReplacement(Long replacedNoteId) {
        return new CorkboardCollectionResponse(
                periodKey,
                title,
                periodStart,
                periodEnd,
                status,
                readOnly,
                pages,
                replacedNoteId != null,
                replacedNoteId
        );
    }
}
