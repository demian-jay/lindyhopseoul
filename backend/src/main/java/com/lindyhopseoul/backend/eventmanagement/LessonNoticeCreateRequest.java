package com.lindyhopseoul.backend.eventmanagement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LessonNoticeCreateRequest(
        @NotBlank
        @Size(max = 2000)
        String content
) {
}
