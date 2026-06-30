package com.lindyhopseoul.backend.agora;

import java.time.LocalDate;

public record AdminCorkboardPeriodCreateRequest(
        String periodKey,
        String title,
        LocalDate periodStart,
        LocalDate periodEnd
) {
}
