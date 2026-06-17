package com.lindyhopseoul.backend.eventmanagement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EventApplicationCreateRequest(
        @NotNull(message = "Event ID is required.")
        Long eventId,

        Long lessonId,

        @NotBlank(message = "Applicant name is required.")
        @Size(max = 100, message = "Applicant name must be 100 characters or fewer.")
        String applicantName,

        ApplicationContactMethod contactMethod,

        @Size(max = 200, message = "Contact value must be 200 characters or fewer.")
        String contactValue,

        @Size(max = 2000, message = "Request memo must be 2000 characters or fewer.")
        String requestMemo,

        @Size(max = 10, message = "Language code must be 10 characters or fewer.")
        String languageCode,

        ApplicationDanceRole danceRole
) {
}
