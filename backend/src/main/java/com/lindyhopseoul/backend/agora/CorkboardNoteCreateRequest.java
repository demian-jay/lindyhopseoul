package com.lindyhopseoul.backend.agora;

public record CorkboardNoteCreateRequest(
        String stickerTemplateKey,
        String content
) {
}
