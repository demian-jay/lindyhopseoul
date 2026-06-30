package com.lindyhopseoul.backend.agora;

public record AdminCorkboardNoteCreateRequest(
        String periodKey,
        String stickerTemplateKey,
        String content
) {
}
