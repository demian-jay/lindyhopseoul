package com.lindyhopseoul.backend.eventmanagement;

import java.time.Instant;
import java.time.LocalDate;

public record MemberClassApplicationResponse(
        Long applicationId,
        Long classId,
        String scheduleItemId,
        String classTitle,
        LocalDate classDate,
        ApplicationDanceRole role,
        String status,
        Instant appliedAt
) {
}
