package com.lindyhopseoul.backend.agora;

public record CorkboardNotePositionRequest(
        Double positionX,
        Double positionY,
        Double rotationDeg
) {
}
