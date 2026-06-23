package com.lindyhopseoul.backend.auth;

import com.lindyhopseoul.backend.member.MemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final MemberRepository memberRepository;
    private final SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();

    public AuthController(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    @GetMapping("/me")
    public AuthMeResponse me(HttpServletRequest request) {
        Long memberId = currentMemberId(request);
        if (memberId == null) {
            return AuthMeResponse.unauthenticated();
        }

        return memberRepository.findById(memberId)
                .map(AuthMeResponse::authenticated)
                .orElseGet(AuthMeResponse::unauthenticated);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) {
        logoutHandler.logout(request, response, authentication);
    }

    private Long currentMemberId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return null;
        }
        Object memberId = session.getAttribute(AuthSessionConstants.MEMBER_ID_ATTRIBUTE);
        if (memberId instanceof Long value) {
            return value;
        }
        if (memberId instanceof Number value) {
            return value.longValue();
        }
        return null;
    }
}
