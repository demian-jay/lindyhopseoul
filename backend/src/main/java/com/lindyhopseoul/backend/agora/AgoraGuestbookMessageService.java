package com.lindyhopseoul.backend.agora;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.exception.ConflictException;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import com.lindyhopseoul.backend.exception.ResourceNotFoundException;
import com.lindyhopseoul.backend.member.Member;
import com.lindyhopseoul.backend.member.MemberPreferredLanguage;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AgoraGuestbookMessageService {

    private static final int MAX_VISIBLE_MESSAGES = 5;
    private static final int MAX_MESSAGE_LENGTH = 120;
    private static final Duration MESSAGE_TTL = Duration.ofDays(7);

    private final AgoraGuestbookMessageRepository agoraGuestbookMessageRepository;

    public AgoraGuestbookMessageService(AgoraGuestbookMessageRepository agoraGuestbookMessageRepository) {
        this.agoraGuestbookMessageRepository = agoraGuestbookMessageRepository;
    }

    public List<AgoraGuestbookMessageResponse> findVisibleMessages() {
        return agoraGuestbookMessageRepository
                .findByVisibleTrueAndHiddenByAdminFalseAndExpiresAtAfterOrderByCreatedAtDescIdDesc(
                        Instant.now(),
                        PageRequest.of(0, MAX_VISIBLE_MESSAGES)
                )
                .stream()
                .map(AgoraGuestbookMessageResponse::from)
                .toList();
    }

    @Transactional
    public AgoraGuestbookMessageResponse createMessage(
            Member member,
            AgoraGuestbookMessageCreateRequest request
    ) {
        String content = cleanMessage(request.message());
        Instant createdAt = Instant.now();
        AgoraGuestbookMessage guestbookMessage = AgoraGuestbookMessage.create(
                member.getId(),
                nicknameSnapshot(member),
                content,
                createdAt,
                createdAt.plus(MESSAGE_TTL)
        );
        return AgoraGuestbookMessageResponse.from(agoraGuestbookMessageRepository.save(guestbookMessage));
    }

    public List<AgoraGuestbookMessageResponse> findAdminMessages(AdminPrincipal actor) {
        requireGuestbookManager(actor);
        return agoraGuestbookMessageRepository.findAllByOrderByCreatedAtDescIdDesc()
                .stream()
                .map(AgoraGuestbookMessageResponse::from)
                .toList();
    }

    @Transactional
    public AgoraGuestbookMessageResponse updateAdminHidden(
            AdminPrincipal actor,
            Long id,
            AgoraGuestbookMessageHiddenRequest request
    ) {
        requireGuestbookManager(actor);
        AgoraGuestbookMessage message = findMessage(id);
        message.changeAdminHidden(request.hidden(), actor.userCd(), Instant.now());
        return AgoraGuestbookMessageResponse.from(message);
    }

    private AgoraGuestbookMessage findMessage(Long id) {
        return agoraGuestbookMessageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agora guestbook message not found: " + id));
    }

    private void requireGuestbookManager(AdminPrincipal actor) {
        if (actor == null || !actor.canManageEvents()) {
            throw new ForbiddenException("Only administrators can manage Agora guestbook messages.");
        }
    }

    private String cleanMessage(String value) {
        String cleaned = value == null ? "" : value.trim();
        if (cleaned.isBlank()) {
            throw new ConflictException("Guestbook message is required.");
        }
        if (cleaned.length() > MAX_MESSAGE_LENGTH) {
            throw new ConflictException("Guestbook message must be 120 characters or less.");
        }
        return cleaned;
    }

    private String nicknameSnapshot(Member member) {
        String nickname = member.getNickname() == null ? "" : member.getNickname().trim();
        if (!nickname.isBlank()) {
            return nickname;
        }
        return member.getPreferredLanguage() == MemberPreferredLanguage.EN ? "Member" : "회원";
    }
}
