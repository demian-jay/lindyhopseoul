package com.lindyhopseoul.backend.agora;

import java.time.LocalDate;

public record AdminCorkboardPeriodUpdateRequest(
        String title,
        LocalDate periodStart,
        LocalDate periodEnd
) {
}
