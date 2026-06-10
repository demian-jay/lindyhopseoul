package com.lindyhopseoul.backend.eventmanagement;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EventRequest(
        @NotNull EventType eventType,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @NotBlank @Size(max = 200) String location,
        @NotNull EventStatus status,
        @NotNull Integer displayOrder,
        @NotNull Map<String, @Valid EventTranslationRequest> translations
) {

    public record EventTranslationRequest(
            @NotBlank @Size(max = 160) String title,
            @NotBlank @Size(max = 500) String shortDescription,
            @NotBlank String description
    ) {
    }
}
