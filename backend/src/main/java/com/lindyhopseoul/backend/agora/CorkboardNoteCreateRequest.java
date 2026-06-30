package com.lindyhopseoul.backend.agora;

public record CorkboardNoteCreateRequest(
        String stickerTemplateKey,
        String content,
        Double positionX,
        Double positionY,
        Double rotationDeg,
        Integer pageNo
) {

    public CorkboardNoteCreateRequest(String stickerTemplateKey, String content) {
        this(stickerTemplateKey, content, null, null, null, null);
    }
}
