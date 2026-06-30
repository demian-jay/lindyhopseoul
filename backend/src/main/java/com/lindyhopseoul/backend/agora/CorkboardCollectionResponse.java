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
        List<CorkboardPageResponse> pages
) {
}
