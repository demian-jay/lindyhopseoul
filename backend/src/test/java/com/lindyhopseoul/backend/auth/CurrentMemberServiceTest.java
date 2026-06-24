package com.lindyhopseoul.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;

import com.lindyhopseoul.backend.member.Member;
import com.lindyhopseoul.backend.member.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class CurrentMemberServiceTest {

    @Mock
    private MemberRepository memberRepository;

    private CurrentMemberService currentMemberService;

    @BeforeEach
    void setUp() {
        currentMemberService = new CurrentMemberService(memberRepository);
    }

    @Test
    void findCurrentMemberIgnoresWithdrawnMemberInSession() {
        Member member = Member.createGoogle(
                "google-sub-1",
                "user@example.com",
                "Google Name",
                Instant.parse("2026-06-01T00:00:00Z")
        );
        ReflectionTestUtils.setField(member, "id", 123L);
        member.withdraw(Instant.parse("2026-06-23T09:00:00Z"));
        when(memberRepository.findById(123L)).thenReturn(Optional.of(member));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.getSession(true).setAttribute(AuthSessionConstants.MEMBER_ID_ATTRIBUTE, 123L);

        assertThat(currentMemberService.findCurrentMember(request)).isEmpty();
    }

    @Test
    void findCurrentMemberIgnoresSuspendedMemberInSession() {
        Member member = Member.createGoogle(
                "google-sub-1",
                "user@example.com",
                "Google Name",
                Instant.parse("2026-06-01T00:00:00Z")
        );
        ReflectionTestUtils.setField(member, "id", 123L);
        member.suspend();
        when(memberRepository.findById(123L)).thenReturn(Optional.of(member));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.getSession(true).setAttribute(AuthSessionConstants.MEMBER_ID_ATTRIBUTE, 123L);

        assertThat(currentMemberService.findCurrentMember(request)).isEmpty();
    }
}
