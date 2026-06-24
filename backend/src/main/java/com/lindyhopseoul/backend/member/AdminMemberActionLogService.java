package com.lindyhopseoul.backend.member;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminRole;
import com.lindyhopseoul.backend.exception.BadRequestException;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminMemberActionLogService {

    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    private final AdminMemberActionLogRepository adminMemberActionLogRepository;

    public AdminMemberActionLogService(AdminMemberActionLogRepository adminMemberActionLogRepository) {
        this.adminMemberActionLogRepository = adminMemberActionLogRepository;
    }

    public List<AdminMemberActionLogResponse> findLogs(
            AdminPrincipal actor,
            LocalDate from,
            LocalDate to,
            String actorAdminId,
            Long targetMemberId,
            AdminMemberActionType action,
            Long lessonId,
            MemberStatus targetMemberStatus
    ) {
        requireSuperAdmin(actor);
        if (from != null && to != null && to.isBefore(from)) {
            throw new BadRequestException("The end date cannot be before the start date.");
        }

        return adminMemberActionLogRepository.search(
                        startOfDay(from),
                        endExclusive(to),
                        cleanNullable(actorAdminId),
                        targetMemberId,
                        action,
                        lessonId,
                        targetMemberStatus
                )
                .stream()
                .map(AdminMemberActionLogResponse::from)
                .toList();
    }

    private void requireSuperAdmin(AdminPrincipal actor) {
        if (actor == null || !actor.hasRole(AdminRole.SUPER_ADMIN)) {
            throw new ForbiddenException("Only super administrators can view member action logs.");
        }
    }

    private Instant startOfDay(LocalDate date) {
        return date == null ? null : date.atStartOfDay(SEOUL_ZONE).toInstant();
    }

    private Instant endExclusive(LocalDate date) {
        return date == null ? null : date.plusDays(1).atStartOfDay(SEOUL_ZONE).toInstant();
    }

    private String cleanNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
