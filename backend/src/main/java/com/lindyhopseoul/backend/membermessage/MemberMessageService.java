package com.lindyhopseoul.backend.membermessage;

import java.time.Instant;
import java.util.List;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.exception.BadRequestException;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import com.lindyhopseoul.backend.exception.ResourceNotFoundException;
import com.lindyhopseoul.backend.exception.UnauthorizedException;
import com.lindyhopseoul.backend.member.Member;
import com.lindyhopseoul.backend.member.MemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MemberMessageService {

    private static final int MAX_CONTENT_LENGTH = 2000;

    private final MemberRepository memberRepository;
    private final MemberMessageThreadRepository threadRepository;
    private final MemberMessageRepository messageRepository;

    public MemberMessageService(
            MemberRepository memberRepository,
            MemberMessageThreadRepository threadRepository,
            MemberMessageRepository messageRepository
    ) {
        this.memberRepository = memberRepository;
        this.threadRepository = threadRepository;
        this.messageRepository = messageRepository;
    }

    @Transactional
    public MemberMessageThreadResponse findMyThread(Long memberId) {
        return threadRepository.findByMemberId(memberId)
                .map(thread -> {
                    thread.markMemberRead(Instant.now());
                    return toThreadResponse(thread, findMessages(thread.getId()));
                })
                .orElseGet(MemberMessageThreadResponse::empty);
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse findMyUnreadCount(Long memberId) {
        long count = threadRepository.findByMemberId(memberId)
                .filter(MemberMessageThread::isUnreadByMember)
                .map(thread -> 1L)
                .orElse(0L);
        return new UnreadCountResponse(count);
    }

    @Transactional
    public MemberMessageThreadResponse createMemberMessage(Long memberId, MemberMessageCreateRequest request) {
        Member member = findMember(memberId);
        String content = normalizeContent(request == null ? null : request.content());
        Instant now = Instant.now();

        MemberMessageThread thread = threadRepository.findByMemberId(memberId)
                .orElseGet(() -> threadRepository.save(MemberMessageThread.create(member, now)));

        messageRepository.save(MemberMessage.create(
                thread,
                member,
                MemberMessageSenderType.MEMBER,
                content,
                now
        ));
        thread.recordMemberMessage(now);
        thread.markMemberRead(now);

        return toThreadResponse(thread, findMessages(thread.getId()));
    }

    @Transactional(readOnly = true)
    public List<AdminMessageThreadSummaryResponse> findAdminThreads(AdminPrincipal actor) {
        requireMessageAdmin(actor);
        return threadRepository.findAllByOrderByLastMessageAtDescIdDesc()
                .stream()
                .map(thread -> AdminMessageThreadSummaryResponse.from(
                        thread,
                        messageRepository.findTopByThreadIdOrderByCreatedAtDescIdDesc(thread.getId()).orElse(null),
                        unreadMemberMessageCountForAdmin(thread)
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse findAdminUnreadCount(AdminPrincipal actor) {
        requireMessageAdmin(actor);
        long count = threadRepository.findAllByOrderByLastMessageAtDescIdDesc()
                .stream()
                .filter(MemberMessageThread::isUnreadByAdmin)
                .count();
        return new UnreadCountResponse(count);
    }

    @Transactional
    public AdminMessageThreadDetailResponse findAdminThread(AdminPrincipal actor, Long threadId) {
        requireMessageAdmin(actor);
        MemberMessageThread thread = findThread(threadId);
        thread.markAdminRead(Instant.now());
        return toAdminThreadDetailResponse(thread, findMessages(thread.getId()));
    }

    @Transactional
    public AdminMessageThreadDetailResponse createAdminMessage(
            AdminPrincipal actor,
            Long threadId,
            MemberMessageCreateRequest request
    ) {
        requireMessageAdmin(actor);
        MemberMessageThread thread = findThread(threadId);
        String content = normalizeContent(request == null ? null : request.content());
        Instant now = Instant.now();

        messageRepository.save(MemberMessage.createAdmin(
                thread,
                actor.userCd(),
                adminDisplayName(actor),
                content,
                now
        ));
        thread.recordStaffMessage(now);
        thread.markAdminRead(now);

        return toAdminThreadDetailResponse(thread, findMessages(thread.getId()));
    }

    private Member findMember(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new UnauthorizedException("Login is required."));
    }

    private MemberMessageThread findThread(Long threadId) {
        return threadRepository.findById(threadId)
                .orElseThrow(() -> new ResourceNotFoundException("Message thread not found."));
    }

    private List<MemberMessage> findMessages(Long threadId) {
        if (threadId == null) {
            return List.of();
        }
        return messageRepository.findByThreadIdOrderByCreatedAtAscIdAsc(threadId);
    }

    private MemberMessageThreadResponse toThreadResponse(MemberMessageThread thread, List<MemberMessage> messages) {
        return new MemberMessageThreadResponse(
                thread.getId(),
                messages.stream().map(MemberMessageResponse::from).toList(),
                thread.isUnreadByMember(),
                unreadStaffMessageCountForMember(thread)
        );
    }

    private AdminMessageThreadDetailResponse toAdminThreadDetailResponse(
            MemberMessageThread thread,
            List<MemberMessage> messages
    ) {
        return new AdminMessageThreadDetailResponse(
                thread.getId(),
                AdminMessageThreadMemberResponse.from(thread.getMember()),
                messages.stream().map(MemberMessageResponse::from).toList()
        );
    }

    private void requireMessageAdmin(AdminPrincipal actor) {
        if (actor == null || !actor.canManageEvents()) {
            throw new ForbiddenException("Only administrators can manage member messages.");
        }
    }

    private long unreadMemberMessageCountForAdmin(MemberMessageThread thread) {
        if (!thread.isUnreadByAdmin()) {
            return 0;
        }
        if (thread.getAdminLastReadAt() == null) {
            return messageRepository.countByThreadIdAndSenderType(thread.getId(), MemberMessageSenderType.MEMBER);
        }
        return messageRepository.countByThreadIdAndSenderTypeAndCreatedAtAfter(
                thread.getId(),
                MemberMessageSenderType.MEMBER,
                thread.getAdminLastReadAt()
        );
    }

    private long unreadStaffMessageCountForMember(MemberMessageThread thread) {
        if (!thread.isUnreadByMember()) {
            return 0;
        }
        if (thread.getMemberLastReadAt() == null) {
            return messageRepository.countByThreadIdAndSenderType(thread.getId(), MemberMessageSenderType.ADMIN);
        }
        return messageRepository.countByThreadIdAndSenderTypeAndCreatedAtAfter(
                thread.getId(),
                MemberMessageSenderType.ADMIN,
                thread.getMemberLastReadAt()
        );
    }

    private String adminDisplayName(AdminPrincipal actor) {
        if (actor == null || actor.userNm() == null || actor.userNm().isBlank()) {
            return null;
        }

        String displayName = actor.userNm().strip();
        String loginId = actor.loginId();
        if (displayName.contains("@") || (loginId != null && displayName.equalsIgnoreCase(loginId.strip()))) {
            return null;
        }
        return displayName;
    }

    private String normalizeContent(String content) {
        if (content == null) {
            throw new BadRequestException("Message content is required.");
        }

        String normalized = content.strip();
        if (normalized.isBlank()) {
            throw new BadRequestException("Message content is required.");
        }
        if (normalized.length() > MAX_CONTENT_LENGTH) {
            throw new BadRequestException("Message content must be 2000 characters or fewer.");
        }
        return normalized;
    }
}
