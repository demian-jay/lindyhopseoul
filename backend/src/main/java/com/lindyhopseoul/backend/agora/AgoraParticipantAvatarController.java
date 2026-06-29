package com.lindyhopseoul.backend.agora;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AgoraParticipantAvatarController {

    private final AgoraParticipantAvatarService agoraParticipantAvatarService;

    public AgoraParticipantAvatarController(AgoraParticipantAvatarService agoraParticipantAvatarService) {
        this.agoraParticipantAvatarService = agoraParticipantAvatarService;
    }

    @GetMapping({"/api/agora/participant-avatars", "/api/agora/class-participant-avatars"})
    public AgoraParticipantAvatarListResponse findParticipantAvatars() {
        return agoraParticipantAvatarService.findParticipantAvatars();
    }
}
