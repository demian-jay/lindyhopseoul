package com.lindyhopseoul.backend.membermessage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
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
        assertThat(thread.getLastMemberMessageAt()).isNotNull();
        assertThat(thread.isUnreadByAdmin()).isTrue();
        assertThat(thread.isUnreadByMember()).isFalse();
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
        assertThat(thread.getLastStaffMessageAt()).isNotNull();
        assertThat(thread.isUnreadByAdmin()).isFalse();
        assertThat(thread.isUnreadByMember()).isTrue();
    }

    @Test
    void findAdminThreadMarksThreadReadForAllAdmins() {
        AdminPrincipal staff = new AdminPrincipal(
                "staff-1",
                "Gamja",
                "staff",
                AdminRole.STAFF,
                List.of(AdminRole.STAFF),
                AdminLanguage.Kor
        );
        thread.recordMemberMessage(Instant.parse("2026-06-23T01:00:00Z"));
        when(threadRepository.findById(10L)).thenReturn(Optional.of(thread));
        when(messageRepository.findByThreadIdOrderByCreatedAtAscIdAsc(10L)).thenReturn(List.of());

        memberMessageService.findAdminThread(staff, 10L);

        assertThat(thread.getAdminLastReadAt()).isNotNull();
        assertThat(thread.isUnreadByAdmin()).isFalse();
    }

    @Test
    void findAdminUnreadCountCountsThreadsWithUnreadMemberMessages() {
        AdminPrincipal staff = new AdminPrincipal(
                "staff-1",
                "Gamja",
                "staff",
                AdminRole.STAFF,
                List.of(AdminRole.STAFF),
                AdminLanguage.Kor
        );
        MemberMessageThread readThread = MemberMessageThread.create(member, Instant.parse("2026-06-23T00:00:00Z"));
        ReflectionTestUtils.setField(readThread, "id", 11L);
        thread.recordMemberMessage(Instant.parse("2026-06-23T01:00:00Z"));
        readThread.recordMemberMessage(Instant.parse("2026-06-23T01:00:00Z"));
        readThread.markAdminRead(Instant.parse("2026-06-23T02:00:00Z"));
        when(threadRepository.findAllByOrderByLastMessageAtDescIdDesc()).thenReturn(List.of(thread, readThread));

        UnreadCountResponse response = memberMessageService.findAdminUnreadCount(staff);

        assertThat(response.count()).isEqualTo(1);
    }

    @Test
    void findAdminThreadsIncludesUnreadFlagAndUnreadMemberMessageCount() {
        AdminPrincipal staff = new AdminPrincipal(
                "staff-1",
                "Gamja",
                "staff",
                AdminRole.STAFF,
                List.of(AdminRole.STAFF),
                AdminLanguage.Kor
        );
        thread.recordMemberMessage(Instant.parse("2026-06-23T01:00:00Z"));
        when(threadRepository.findAllByOrderByLastMessageAtDescIdDesc()).thenReturn(List.of(thread));
        when(messageRepository.findTopByThreadIdOrderByCreatedAtDescIdDesc(10L)).thenReturn(Optional.empty());
        when(messageRepository.countByThreadIdAndSenderType(10L, MemberMessageSenderType.MEMBER)).thenReturn(2L);

        List<AdminMessageThreadSummaryResponse> responses = memberMessageService.findAdminThreads(staff);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).unreadByAdmin()).isTrue();
        assertThat(responses.get(0).unreadMessageCountForAdmin()).isEqualTo(2);
    }

    @Test
    void findMyThreadMarksStaffMessagesReadForMember() {
        thread.recordStaffMessage(Instant.parse("2026-06-23T01:00:00Z"));
        when(threadRepository.findByMemberId(1L)).thenReturn(Optional.of(thread));
        when(messageRepository.findByThreadIdOrderByCreatedAtAscIdAsc(10L)).thenReturn(List.of());

        MemberMessageThreadResponse response = memberMessageService.findMyThread(1L);

        assertThat(thread.getMemberLastReadAt()).isNotNull();
        assertThat(thread.isUnreadByMember()).isFalse();
        assertThat(response.unreadByMember()).isFalse();
        assertThat(response.unreadMessageCountForMember()).isZero();
    }

    @Test
    void findMyUnreadCountCountsStaffRepliesOnly() {
        thread.recordStaffMessage(Instant.parse("2026-06-23T01:00:00Z"));
        when(threadRepository.findByMemberId(1L)).thenReturn(Optional.of(thread));

        UnreadCountResponse response = memberMessageService.findMyUnreadCount(1L);

        assertThat(response.count()).isEqualTo(1);
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
    void sendAdminMessagesCreatesIndividualStaffMessagesAndSkipsUnavailableMembers() {
        AdminPrincipal staff = new AdminPrincipal(
                "staff-1",
                "Gamja",
                "staff",
                AdminRole.STAFF,
                List.of(AdminRole.STAFF),
                AdminLanguage.Kor
        );
        Member suspendedMember = Member.createGoogle(
                "google-sub-2",
                "suspended@example.com",
                "Suspended User",
                Instant.parse("2026-06-23T00:00:00Z")
        );
        ReflectionTestUtils.setField(suspendedMember, "id", 2L);
        suspendedMember.suspend();

        when(memberRepository.findAllById(List.of(1L, 2L, 99L))).thenReturn(List.of(member, suspendedMember));
        when(threadRepository.findByMemberId(1L)).thenReturn(Optional.empty());
        when(threadRepository.save(any(MemberMessageThread.class))).thenReturn(thread);

        AdminMemberMessageSendResponse response = memberMessageService.sendAdminMessages(
                staff,
                new AdminMemberMessageSendRequest(List.of(1L, 2L, 2L, 99L), "  안녕하세요. 안내드립니다.  ")
        );

        ArgumentCaptor<MemberMessage> messageCaptor = ArgumentCaptor.forClass(MemberMessage.class);
        verify(messageRepository).save(messageCaptor.capture());
        MemberMessage savedMessage = messageCaptor.getValue();

        assertThat(response.requestedCount()).isEqualTo(3);
        assertThat(response.sentCount()).isEqualTo(1);
        assertThat(response.skippedCount()).isEqualTo(2);
        assertThat(response.skippedMembers())
                .extracting(AdminMemberMessageSendResponse.SkippedMember::memberId)
                .containsExactly(2L, 99L);
        assertThat(response.skippedMembers())
                .extracting(AdminMemberMessageSendResponse.SkippedMember::reason)
                .containsExactly("SUSPENDED", "NOT_FOUND");
        assertThat(savedMessage.getSenderType()).isEqualTo(MemberMessageSenderType.ADMIN);
        assertThat(savedMessage.getSenderMember()).isNull();
        assertThat(savedMessage.getSenderAdminId()).isEqualTo("staff-1");
        assertThat(savedMessage.getSenderAdminDisplayName()).isEqualTo("Gamja");
        assertThat(savedMessage.getContent()).isEqualTo("안녕하세요. 안내드립니다.");
        assertThat(thread.getLastStaffMessageAt()).isNotNull();
        assertThat(thread.isUnreadByMember()).isTrue();
        assertThat(thread.isUnreadByAdmin()).isFalse();
    }

    @Test
    void sendAdminMessagesReusesExistingMemberThread() {
        AdminPrincipal staff = new AdminPrincipal(
                "staff-1",
                "Gamja",
                "staff",
                AdminRole.STAFF,
                List.of(AdminRole.STAFF),
                AdminLanguage.Kor
        );
        when(memberRepository.findAllById(List.of(1L))).thenReturn(List.of(member));
        when(threadRepository.findByMemberId(1L)).thenReturn(Optional.of(thread));

        AdminMemberMessageSendResponse response = memberMessageService.sendAdminMessages(
                staff,
                new AdminMemberMessageSendRequest(List.of(1L), "기존 대화방으로 보냅니다.")
        );

        verify(threadRepository, never()).save(any(MemberMessageThread.class));
        verify(messageRepository, times(1)).save(any(MemberMessage.class));
        assertThat(response.sentCount()).isEqualTo(1);
        assertThat(thread.getLastStaffMessageAt()).isNotNull();
    }

    @Test
    void sendAdminMessagesRejectsUnauthorizedPrincipal() {
        AdminPrincipal memberPrincipal = new AdminPrincipal(
                "member-admin",
                "Member Admin",
                "member",
                AdminRole.MEMBER,
                List.of(AdminRole.MEMBER),
                AdminLanguage.Kor
        );

        assertThatThrownBy(() -> memberMessageService.sendAdminMessages(
                memberPrincipal,
                new AdminMemberMessageSendRequest(List.of(1L), "안내드립니다.")
        )).isInstanceOf(ForbiddenException.class);
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
