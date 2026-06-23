package com.lindyhopseoul.backend.auth;

import java.util.Optional;

import com.lindyhopseoul.backend.exception.UnauthorizedException;
import com.lindyhopseoul.backend.member.Member;
import com.lindyhopseoul.backend.member.MemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Service;

@Service
public class CurrentMemberService {

    private final MemberRepository memberRepository;

    public CurrentMemberService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    public Optional<Member> findCurrentMember(HttpServletRequest request) {
        Long memberId = currentMemberId(request);
        if (memberId == null) {
            return Optional.empty();
        }
        return memberRepository.findById(memberId);
    }

    public Member requireCurrentMember(HttpServletRequest request) {
        return findCurrentMember(request)
                .orElseThrow(() -> new UnauthorizedException("Login is required."));
    }

    public Long requireCurrentMemberId(HttpServletRequest request) {
        Long memberId = currentMemberId(request);
        if (memberId == null) {
            throw new UnauthorizedException("Login is required.");
        }
        return memberId;
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
