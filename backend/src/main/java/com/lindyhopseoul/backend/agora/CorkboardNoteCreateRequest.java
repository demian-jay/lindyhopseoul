package com.lindyhopseoul.backend.agora;

public record CorkboardNoteCreateRequest(
        String stickerTemplateKey,
        String content,
        Double positionX,
        Double positionY,
        Double rotationDeg,
        Integer pageNo,
        Boolean replaceExisting
) {

    public CorkboardNoteCreateRequest(String stickerTemplateKey, String content) {
        this(stickerTemplateKey, content, null, null, null, null, null);
    }

    public CorkboardNoteCreateRequest(
            String stickerTemplateKey,
            String content,
            Double positionX,
            Double positionY,
            Double rotationDeg,
            Integer pageNo
    ) {
        this(stickerTemplateKey, content, positionX, positionY, rotationDeg, pageNo, null);
    }

    public boolean shouldReplaceExisting() {
        return Boolean.TRUE.equals(replaceExisting);
    }
}
