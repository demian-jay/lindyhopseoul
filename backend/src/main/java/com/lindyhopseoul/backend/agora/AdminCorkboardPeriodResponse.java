package com.lindyhopseoul.backend.agora;

import java.time.LocalDate;

public record AdminCorkboardPeriodResponse(
        String periodKey,
        String title,
        LocalDate periodStart,
        LocalDate periodEnd,
        CorkboardStatus status,
        int pageCount,
        long noteCount,
        boolean writable
) {
}
