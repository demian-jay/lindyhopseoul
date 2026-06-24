package com.lindyhopseoul.backend.membermessage;

import java.util.List;

import com.lindyhopseoul.backend.admin.AdminSessionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/message-threads")
public class AdminMessageThreadController {

    private final AdminSessionService adminSessionService;
    private final MemberMessageService memberMessageService;

    public AdminMessageThreadController(
            AdminSessionService adminSessionService,
            MemberMessageService memberMessageService
    ) {
        this.adminSessionService = adminSessionService;
        this.memberMessageService = memberMessageService;
    }

    @GetMapping
    public List<AdminMessageThreadSummaryResponse> findThreads(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return memberMessageService.findAdminThreads(adminSessionService.requirePrincipal(authorization));
    }

    @GetMapping("/unread-count")
    public UnreadCountResponse findUnreadCount(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return memberMessageService.findAdminUnreadCount(adminSessionService.requirePrincipal(authorization));
    }

    @GetMapping("/{threadId}")
    public AdminMessageThreadDetailResponse findThread(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long threadId
    ) {
        return memberMessageService.findAdminThread(
                adminSessionService.requirePrincipal(authorization),
                threadId
        );
    }

    @PostMapping("/{threadId}/messages")
    public AdminMessageThreadDetailResponse createAdminMessage(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long threadId,
            @RequestBody(required = false) MemberMessageCreateRequest createRequest
    ) {
        return memberMessageService.createAdminMessage(
                adminSessionService.requirePrincipal(authorization),
                threadId,
                createRequest
        );
    }
}
