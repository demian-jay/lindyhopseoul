package com.lindyhopseoul.backend.memo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MemoCreateRequest(
        @NotBlank(message = "Title is required.")
        @Size(max = 120, message = "Title must be 120 characters or fewer.")
        String title,

        @NotBlank(message = "Content is required.")
        @Size(max = 4000, message = "Content must be 4000 characters or fewer.")
        String content
) {
}
