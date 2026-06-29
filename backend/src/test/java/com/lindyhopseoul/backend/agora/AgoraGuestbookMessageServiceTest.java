package com.lindyhopseoul.backend.agora;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.lindyhopseoul.backend.admin.AdminLanguage;
import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminRole;
import com.lindyhopseoul.backend.exception.ConflictException;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import com.lindyhopseoul.backend.member.Member;
import com.lindyhopseoul.backend.member.MemberPreferredLanguage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AgoraGuestbookMessageServiceTest {

    @Mock
    private AgoraGuestbookMessageRepository repository;

    private AgoraGuestbookMessageService service;

    @BeforeEach
    void setUp() {
        service = new AgoraGuestbookMessageService(repository);
    }

    @Test
    void createMessageStoresNicknameSnapshotAndSevenDayExpiry() {
        Member member = member(7L, "Sunny");
        when(repository.save(any(AgoraGuestbookMessage.class))).thenAnswer(invocation -> {
            AgoraGuestbookMessage message = invocation.getArgument(0);
            ReflectionTestUtils.setField(message, "id", 11L);
            message.prePersist();
            return message;
        });

        AgoraGuestbookMessageResponse response = service.createMessage(
                member,
                new AgoraGuestbookMessageCreateRequest("  오늘도 즐겁게 춤춰요!  ")
        );

        ArgumentCaptor<AgoraGuestbookMessage> messageCaptor = ArgumentCaptor.forClass(AgoraGuestbookMessage.class);
        verify(repository).save(messageCaptor.capture());
        AgoraGuestbookMessage savedMessage = messageCaptor.getValue();

        assertThat(response.id()).isEqualTo(11L);
        assertThat(response.memberId()).isEqualTo(7L);
        assertThat(response.nickname()).isEqualTo("Sunny");
        assertThat(response.nicknameSnapshot()).isEqualTo("Sunny");
        assertThat(response.message()).isEqualTo("오늘도 즐겁게 춤춰요!");
        assertThat(response.hiddenByAdmin()).isFalse();
        assertThat(response.visible()).isTrue();
        assertThat(Duration.between(response.createdAt(), response.expiresAt())).isEqualTo(Duration.ofDays(7));
        assertThat(savedMessage.getMessage()).isEqualTo("오늘도 즐겁게 춤춰요!");
    }

    @Test
    void createMessageRejectsBlankAndTooLongContent() {
        Member member = member(7L, "Sunny");

        assertThatThrownBy(() -> service.createMessage(member, new AgoraGuestbookMessageCreateRequest("   ")))
                .isInstanceOf(ConflictException.class);
        assertThatThrownBy(() -> service.createMessage(member, new AgoraGuestbookMessageCreateRequest("a".repeat(121))))
                .isInstanceOf(ConflictException.class);

        verify(repository, never()).save(any(AgoraGuestbookMessage.class));
    }

    @Test
    void findVisibleMessagesReturnsRepositoryResults() {
        AgoraGuestbookMessage message = message(1L, 7L, "Sunny", "안녕하세요");
        when(repository.findByVisibleTrueAndHiddenByAdminFalseAndExpiresAtAfterOrderByCreatedAtDescIdDesc(
                any(Instant.class),
                any()
        )).thenReturn(List.of(message));

        List<AgoraGuestbookMessageResponse> responses = service.findVisibleMessages();

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).id()).isEqualTo(1L);
        assertThat(responses.get(0).nickname()).isEqualTo("Sunny");
    }

    @Test
    void adminHiddenToggleRequiresStaffRole() {
        AdminPrincipal memberPrincipal = new AdminPrincipal(
                "member-admin",
                "Member Admin",
                "member",
                AdminRole.MEMBER,
                List.of(AdminRole.MEMBER),
                AdminLanguage.Kor
        );

        assertThatThrownBy(() -> service.updateAdminHidden(
                memberPrincipal,
                1L,
                new AgoraGuestbookMessageHiddenRequest(true)
        )).isInstanceOf(ForbiddenException.class);
    }

    @Test
    void adminHiddenToggleStoresAndClearsHiddenMetadata() {
        AdminPrincipal staff = new AdminPrincipal(
                "staff-1",
                "Staff",
                "staff",
                AdminRole.STAFF,
                List.of(AdminRole.STAFF),
                AdminLanguage.Kor
        );
        AgoraGuestbookMessage message = message(1L, 7L, "Sunny", "안녕하세요");
        when(repository.findById(1L)).thenReturn(Optional.of(message));

        AgoraGuestbookMessageResponse hiddenResponse = service.updateAdminHidden(
                staff,
                1L,
                new AgoraGuestbookMessageHiddenRequest(true)
        );
        AgoraGuestbookMessageResponse visibleResponse = service.updateAdminHidden(
                staff,
                1L,
                new AgoraGuestbookMessageHiddenRequest(false)
        );

        assertThat(hiddenResponse.hiddenByAdmin()).isTrue();
        assertThat(hiddenResponse.hiddenByAdminId()).isEqualTo("staff-1");
        assertThat(hiddenResponse.hiddenAt()).isNotNull();
        assertThat(visibleResponse.hiddenByAdmin()).isFalse();
        assertThat(visibleResponse.hiddenByAdminId()).isNull();
        assertThat(visibleResponse.hiddenAt()).isNull();
    }

    private Member member(Long id, String nickname) {
        Member member = Member.createGoogle(
                "google-sub-" + id,
                "member" + id + "@example.com",
                "Member " + id,
                Instant.parse("2026-06-23T00:00:00Z")
        );
        member.updateSettings(nickname, MemberPreferredLanguage.KO);
        ReflectionTestUtils.setField(member, "id", id);
        return member;
    }

    private AgoraGuestbookMessage message(Long id, Long memberId, String nickname, String content) {
        Instant createdAt = Instant.parse("2026-06-23T00:00:00Z");
        AgoraGuestbookMessage message = AgoraGuestbookMessage.create(
                memberId,
                nickname,
                content,
                createdAt,
                createdAt.plus(Duration.ofDays(7))
        );
        ReflectionTestUtils.setField(message, "id", id);
        message.prePersist();
        return message;
    }
}
