package com.lindyhopseoul.backend.agora;

import java.util.List;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminSessionService;
import com.lindyhopseoul.backend.auth.CurrentMemberService;
import com.lindyhopseoul.backend.member.Member;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AgoraGuestbookMessageController {

    private final AdminSessionService adminSessionService;
    private final CurrentMemberService currentMemberService;
    private final AgoraGuestbookMessageService agoraGuestbookMessageService;

    public AgoraGuestbookMessageController(
            AdminSessionService adminSessionService,
            CurrentMemberService currentMemberService,
            AgoraGuestbookMessageService agoraGuestbookMessageService
    ) {
        this.adminSessionService = adminSessionService;
        this.currentMemberService = currentMemberService;
        this.agoraGuestbookMessageService = agoraGuestbookMessageService;
    }

    @GetMapping("/api/agora/guestbook-messages")
    public List<AgoraGuestbookMessageResponse> findVisibleMessages() {
        return agoraGuestbookMessageService.findVisibleMessages();
    }

    @PostMapping("/api/agora/guestbook-messages")
    @ResponseStatus(HttpStatus.CREATED)
    public AgoraGuestbookMessageResponse createMessage(
            HttpServletRequest servletRequest,
            @Valid @RequestBody AgoraGuestbookMessageCreateRequest request
    ) {
        return agoraGuestbookMessageService.createMessage(requireMember(servletRequest), request);
    }

    @GetMapping("/api/admin/agora/guestbook-messages")
    public List<AgoraGuestbookMessageResponse> findAdminMessages(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return agoraGuestbookMessageService.findAdminMessages(requirePrincipal(authorization));
    }

    @PatchMapping("/api/admin/agora/guestbook-messages/{id}/hidden")
    public AgoraGuestbookMessageResponse updateAdminHidden(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @Valid @RequestBody AgoraGuestbookMessageHiddenRequest request
    ) {
        return agoraGuestbookMessageService.updateAdminHidden(requirePrincipal(authorization), id, request);
    }

    private AdminPrincipal requirePrincipal(String authorization) {
        return adminSessionService.requirePrincipal(authorization);
    }

    private Member requireMember(HttpServletRequest request) {
        return currentMemberService.requireCurrentMember(request);
    }
}
