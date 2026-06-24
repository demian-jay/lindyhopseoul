package com.lindyhopseoul.backend.membermessage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.lindyhopseoul.backend.admin.AdminLanguage;
import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminRole;
import com.lindyhopseoul.backend.exception.BadRequestException;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import com.lindyhopseoul.backend.member.Member;
import com.lindyhopseoul.backend.member.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

class MemberMessageServiceTest {

    private MemberRepository memberRepository;
    private MemberMessageThreadRepository threadRepository;
    private MemberMessageRepository messageRepository;
    private MemberMessageService memberMessageService;
    private Member member;
    private MemberMessageThread thread;

    @BeforeEach
    void setUp() {
        memberRepository = mock(MemberRepository.class);
        threadRepository = mock(MemberMessageThreadRepository.class);
        messageRepository = mock(MemberMessageRepository.class);
        memberMessageService = new MemberMessageService(memberRepository, threadRepository, messageRepository);

        member = Member.createGoogle(
                "google-sub-1",
                "user@example.com",
                "Google User",
                Instant.parse("2026-06-23T00:00:00Z")
        );
        ReflectionTestUtils.setField(member, "id", 1L);

        thread = MemberMessageThread.create(member, Instant.parse("2026-06-23T00:00:00Z"));
        ReflectionTestUtils.setField(thread, "id", 10L);
    }

    @Test
    void createMemberMessageCreatesThreadAndTrimsContent() {
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(threadRepository.findByMemberId(1L)).thenReturn(Optional.empty());
        when(threadRepository.save(any(MemberMessageThread.class))).thenReturn(thread);
        when(messageRepository.findByThreadIdOrderByCreatedAtAscIdAsc(10L)).thenReturn(List.of());

        memberMessageService.createMemberMessage(
                1L,
                new MemberMessageCreateRequest("  수업 신청 관련해서 문의드립니다.  ")
        );

        ArgumentCaptor<MemberMessage> messageCaptor = ArgumentCaptor.forClass(MemberMessage.class);
        org.mockito.Mockito.verify(messageRepository).save(messageCaptor.capture());
        MemberMessage savedMessage = messageCaptor.getValue();

        assertThat(savedMessage.getSenderType()).isEqualTo(MemberMessageSenderType.MEMBER);
        assertThat(savedMessage.getSenderMember()).isEqualTo(member);
        assertThat(savedMessage.getContent()).isEqualTo("수업 신청 관련해서 문의드립니다.");
        assertThat(thread.getLastMessageAt()).isNotNull();
    }

    @Test
    void createMemberMessageRejectsBlankContent() {
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));

        assertThatThrownBy(() -> memberMessageService.createMemberMessage(
                1L,
                new MemberMessageCreateRequest("   ")
        )).isInstanceOf(BadRequestException.class);
    }

    @Test
    void createMemberMessageRejectsTooLongContent() {
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));

        assertThatThrownBy(() -> memberMessageService.createMemberMessage(
                1L,
                new MemberMessageCreateRequest("a".repeat(2001))
        )).isInstanceOf(BadRequestException.class);
    }

    @Test
    void findAdminThreadsRejectsNonStaffAdminPrincipal() {
        AdminPrincipal memberPrincipal = new AdminPrincipal(
                "member-admin",
                "Member Admin",
                "member",
                AdminRole.MEMBER,
                List.of(AdminRole.MEMBER),
                AdminLanguage.Kor
        );

        assertThatThrownBy(() -> memberMessageService.findAdminThreads(memberPrincipal))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void createAdminMessageStoresAdminSenderAndUpdatesThread() {
        AdminPrincipal staff = new AdminPrincipal(
                "staff-1",
                "Gamja",
                "staff",
                AdminRole.STAFF,
                List.of(AdminRole.STAFF),
                AdminLanguage.Kor
        );
        when(threadRepository.findById(10L)).thenReturn(Optional.of(thread));
        when(messageRepository.findByThreadIdOrderByCreatedAtAscIdAsc(10L)).thenReturn(List.of());

        memberMessageService.createAdminMessage(
                staff,
                10L,
                new MemberMessageCreateRequest("  확인 후 안내드리겠습니다.  ")
        );

        ArgumentCaptor<MemberMessage> messageCaptor = ArgumentCaptor.forClass(MemberMessage.class);
        org.mockito.Mockito.verify(messageRepository).save(messageCaptor.capture());
        MemberMessage savedMessage = messageCaptor.getValue();

        assertThat(savedMessage.getSenderType()).isEqualTo(MemberMessageSenderType.ADMIN);
        assertThat(savedMessage.getSenderMember()).isNull();
        assertThat(savedMessage.getSenderAdminId()).isEqualTo("staff-1");
        assertThat(savedMessage.getSenderAdminDisplayName()).isEqualTo("Gamja");
        assertThat(savedMessage.getContent()).isEqualTo("확인 후 안내드리겠습니다.");
        assertThat(thread.getLastMessageAt()).isNotNull();
    }

    @Test
    void createAdminMessageDoesNotStoreLoginIdAsDisplayName() {
        AdminPrincipal staff = new AdminPrincipal(
                "staff-1",
                "staff",
                "staff",
                AdminRole.STAFF,
                List.of(AdminRole.STAFF),
                AdminLanguage.Kor
        );
        when(threadRepository.findById(10L)).thenReturn(Optional.of(thread));
        when(messageRepository.findByThreadIdOrderByCreatedAtAscIdAsc(10L)).thenReturn(List.of());

        memberMessageService.createAdminMessage(
                staff,
                10L,
                new MemberMessageCreateRequest("확인했습니다.")
        );

        ArgumentCaptor<MemberMessage> messageCaptor = ArgumentCaptor.forClass(MemberMessage.class);
        org.mockito.Mockito.verify(messageRepository).save(messageCaptor.capture());

        assertThat(messageCaptor.getValue().getSenderAdminDisplayName()).isNull();
    }

    @Test
    void memberMessageResponseIncludesAdminDisplayNameOnlyForAdminMessages() {
        MemberMessage adminMessage = MemberMessage.createAdmin(
                thread,
                "staff-1",
                "Gamja",
                "확인했습니다.",
                Instant.parse("2026-06-23T01:00:00Z")
        );
        MemberMessage memberMessage = MemberMessage.create(
                thread,
                member,
                MemberMessageSenderType.MEMBER,
                "문의드립니다.",
                Instant.parse("2026-06-23T00:00:00Z")
        );

        MemberMessageResponse adminResponse = MemberMessageResponse.from(adminMessage);
        MemberMessageResponse memberResponse = MemberMessageResponse.from(memberMessage);

        assertThat(adminResponse.senderAdminDisplayName()).isEqualTo("Gamja");
        assertThat(adminResponse.senderName()).isEqualTo("Gamja");
        assertThat(memberResponse.senderAdminDisplayName()).isNull();
    }

    @Test
    void memberMessageResponseFallsBackWhenAdminDisplayNameIsMissing() {
        MemberMessage adminMessage = MemberMessage.createAdmin(
                thread,
                "staff-1",
                "admin@example.com",
                "확인했습니다.",
                Instant.parse("2026-06-23T01:00:00Z")
        );

        MemberMessageResponse response = MemberMessageResponse.from(adminMessage);

        assertThat(response.senderAdminDisplayName()).isNull();
        assertThat(response.senderName()).isEqualTo("Staff");
    }
}
