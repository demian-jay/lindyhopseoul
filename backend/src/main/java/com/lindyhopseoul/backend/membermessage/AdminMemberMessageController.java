package com.lindyhopseoul.backend.membermessage;

import com.lindyhopseoul.backend.admin.AdminSessionService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/member-messages")
public class AdminMemberMessageController {

    private final AdminSessionService adminSessionService;
    private final MemberMessageService memberMessageService;

    public AdminMemberMessageController(
            AdminSessionService adminSessionService,
            MemberMessageService memberMessageService
    ) {
        this.adminSessionService = adminSessionService;
        this.memberMessageService = memberMessageService;
    }

    @PostMapping("/send")
    public AdminMemberMessageSendResponse sendMessages(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody(required = false) AdminMemberMessageSendRequest request
    ) {
        return memberMessageService.sendAdminMessages(
                adminSessionService.requirePrincipal(authorization),
                request
        );
    }
}
