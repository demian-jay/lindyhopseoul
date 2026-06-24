package com.lindyhopseoul.backend.member;

import java.time.LocalDate;
import java.util.List;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminSessionService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdminMemberActionLogController {

    private final AdminSessionService adminSessionService;
    private final AdminMemberActionLogService adminMemberActionLogService;

    public AdminMemberActionLogController(
            AdminSessionService adminSessionService,
            AdminMemberActionLogService adminMemberActionLogService
    ) {
        this.adminSessionService = adminSessionService;
        this.adminMemberActionLogService = adminMemberActionLogService;
    }

    @GetMapping("/api/admin/member-action-logs")
    public List<AdminMemberActionLogResponse> findLogs(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String actorAdminId,
            @RequestParam(required = false) Long targetMemberId,
            @RequestParam(required = false) AdminMemberActionType action,
            @RequestParam(required = false) Long lessonId,
            @RequestParam(required = false) MemberStatus targetMemberStatus
    ) {
        return adminMemberActionLogService.findLogs(
                requirePrincipal(authorization),
                from,
                to,
                actorAdminId,
                targetMemberId,
                action,
                lessonId,
                targetMemberStatus
        );
    }

    private AdminPrincipal requirePrincipal(String authorization) {
        return adminSessionService.requirePrincipal(authorization);
    }
}
