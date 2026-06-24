package com.lindyhopseoul.backend.member;

import java.util.Collection;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.eventmanagement.EventApplication;
import com.lindyhopseoul.backend.eventmanagement.EventApplicationRepository;
import com.lindyhopseoul.backend.eventmanagement.Lesson;
import com.lindyhopseoul.backend.eventmanagement.LessonType;
import com.lindyhopseoul.backend.exception.BadRequestException;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminMemberManagementService {

    private static final EnumSet<MemberStatus> VISIBLE_MEMBER_STATUSES = EnumSet.of(
            MemberStatus.ACTIVE,
            MemberStatus.WITHDRAWN
    );

    private final MemberRepository memberRepository;
    private final EventApplicationRepository eventApplicationRepository;

    public AdminMemberManagementService(
            MemberRepository memberRepository,
            EventApplicationRepository eventApplicationRepository
    ) {
        this.memberRepository = memberRepository;
        this.eventApplicationRepository = eventApplicationRepository;
    }

    public List<AdminMemberResponse> findMembers(
            AdminPrincipal actor,
            String name,
            String nickname,
            String email,
            MemberStatus status,
            MemberPreferredLanguage preferredLanguage
    ) {
        requireMemberAdmin(actor);
        Collection<MemberStatus> statuses = normalizeStatuses(status);
        List<Member> members = memberRepository.findAdminMembers(
                likePattern(name),
                likePattern(nickname),
                likePattern(email),
                statuses,
                preferredLanguage
        );
        Map<Long, AdminMemberApplicationSummary> summaries = summarizeApplications(members);

        return members.stream()
                .map(member -> AdminMemberResponse.from(member, summaries.get(member.getId())))
                .toList();
    }

    private void requireMemberAdmin(AdminPrincipal actor) {
        if (actor == null || !actor.canManageMembers()) {
            throw new ForbiddenException("Only super administrators and staff can manage members.");
        }
    }

    private Collection<MemberStatus> normalizeStatuses(MemberStatus status) {
        if (status == null) {
            return VISIBLE_MEMBER_STATUSES;
        }
        if (!VISIBLE_MEMBER_STATUSES.contains(status)) {
            throw new BadRequestException("Unsupported member status filter.");
        }
        return List.of(status);
    }

    private String likePattern(String value) {
        String normalized = value == null ? "" : value.strip().toLowerCase(Locale.ROOT);
        return normalized.isBlank() ? null : "%" + normalized + "%";
    }

    private Map<Long, AdminMemberApplicationSummary> summarizeApplications(List<Member> members) {
        List<Long> memberIds = members.stream()
                .map(Member::getId)
                .toList();
        if (memberIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, MutableApplicationSummary> mutableSummaries = new LinkedHashMap<>();
        eventApplicationRepository.findByMemberIdsWithLesson(memberIds)
                .forEach(application -> summarizeApplication(mutableSummaries, application));

        Map<Long, AdminMemberApplicationSummary> summaries = new LinkedHashMap<>();
        mutableSummaries.forEach((memberId, summary) -> summaries.put(memberId, summary.toImmutable()));
        return summaries;
    }

    private void summarizeApplication(
            Map<Long, MutableApplicationSummary> summaries,
            EventApplication application
    ) {
        if (application.getMember() == null || application.getMember().getId() == null) {
            return;
        }

        MutableApplicationSummary summary = summaries.computeIfAbsent(
                application.getMember().getId(),
                ignored -> new MutableApplicationSummary()
        );
        summary.totalApplicationCount++;

        Lesson lesson = application.getLesson();
        LessonType lessonType = lesson == null ? null : lesson.getLessonType();
        if (lessonType == LessonType.LEVEL1) {
            summary.level1ApplicationCount++;
        } else if (lessonType == LessonType.LEVEL2) {
            summary.level2ApplicationCount++;
        } else if (lessonType == LessonType.LEVEL3) {
            summary.level3ApplicationCount++;
        } else if (lessonType == LessonType.LEVEL4) {
            summary.level4ApplicationCount++;
        } else {
            summary.workshopApplicationCount++;
        }
    }

    private static final class MutableApplicationSummary {
        private long totalApplicationCount;
        private long level1ApplicationCount;
        private long level2ApplicationCount;
        private long level3ApplicationCount;
        private long level4ApplicationCount;
        private long workshopApplicationCount;

        private AdminMemberApplicationSummary toImmutable() {
            return new AdminMemberApplicationSummary(
                    totalApplicationCount,
                    level1ApplicationCount,
                    level2ApplicationCount,
                    level3ApplicationCount,
                    level4ApplicationCount,
                    workshopApplicationCount
            );
        }
    }
}
