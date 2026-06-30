package com.lindyhopseoul.backend.agora;

public record AdminCorkboardNoteCreateRequest(
        String periodKey,
        String stickerTemplateKey,
        String content,
        Double positionX,
        Double positionY,
        Double rotationDeg,
        Integer pageNo
) {

    public AdminCorkboardNoteCreateRequest(String periodKey, String stickerTemplateKey, String content) {
        this(periodKey, stickerTemplateKey, content, null, null, null, null);
    }
}
