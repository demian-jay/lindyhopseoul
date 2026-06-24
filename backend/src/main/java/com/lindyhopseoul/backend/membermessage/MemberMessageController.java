package com.lindyhopseoul.backend.membermessage;

import com.lindyhopseoul.backend.auth.CurrentMemberService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/members/me/messages")
public class MemberMessageController {

    private final CurrentMemberService currentMemberService;
    private final MemberMessageService memberMessageService;

    public MemberMessageController(
            CurrentMemberService currentMemberService,
            MemberMessageService memberMessageService
    ) {
        this.currentMemberService = currentMemberService;
        this.memberMessageService = memberMessageService;
    }

    @GetMapping
    public MemberMessageThreadResponse findMyMessages(HttpServletRequest request) {
        return memberMessageService.findMyThread(currentMemberService.requireCurrentMemberId(request));
    }

    @GetMapping("/unread-count")
    public UnreadCountResponse findMyUnreadCount(HttpServletRequest request) {
        return memberMessageService.findMyUnreadCount(currentMemberService.requireCurrentMemberId(request));
    }

    @PostMapping
    public MemberMessageThreadResponse createMyMessage(
            HttpServletRequest request,
            @RequestBody(required = false) MemberMessageCreateRequest createRequest
    ) {
        return memberMessageService.createMemberMessage(
                currentMemberService.requireCurrentMemberId(request),
                createRequest
        );
    }
}
