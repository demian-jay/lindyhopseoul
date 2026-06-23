package com.lindyhopseoul.backend.member;

import com.lindyhopseoul.backend.auth.CurrentMemberService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/members/me")
public class MemberAccountController {

    private final CurrentMemberService currentMemberService;
    private final MemberAccountService memberAccountService;
    private final SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();

    public MemberAccountController(
            CurrentMemberService currentMemberService,
            MemberAccountService memberAccountService
    ) {
        this.currentMemberService = currentMemberService;
        this.memberAccountService = memberAccountService;
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void withdraw(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) {
        memberAccountService.withdraw(currentMemberService.requireCurrentMemberId(request));
        logoutHandler.logout(request, response, authentication);
    }
}
