package com.lindyhopseoul.backend.member;

import java.time.Clock;
import java.time.Instant;

import com.lindyhopseoul.backend.exception.UnauthorizedException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MemberAccountService {

    private final MemberRepository memberRepository;
    private final Clock clock;

    @Autowired
    public MemberAccountService(MemberRepository memberRepository) {
        this(memberRepository, Clock.systemUTC());
    }

    MemberAccountService(MemberRepository memberRepository, Clock clock) {
        this.memberRepository = memberRepository;
        this.clock = clock;
    }

    @Transactional
    public void withdraw(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .filter(Member::isActive)
                .orElseThrow(() -> new UnauthorizedException("Login is required."));

        member.withdraw(Instant.now(clock));
    }
}
