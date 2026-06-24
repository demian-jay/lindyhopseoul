package com.lindyhopseoul.backend.member;

import java.util.List;

import com.lindyhopseoul.backend.admin.AdminSessionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/members")
public class AdminMemberManagementController {

    private final AdminSessionService adminSessionService;
    private final AdminMemberManagementService adminMemberManagementService;

    public AdminMemberManagementController(
            AdminSessionService adminSessionService,
            AdminMemberManagementService adminMemberManagementService
    ) {
        this.adminSessionService = adminSessionService;
        this.adminMemberManagementService = adminMemberManagementService;
    }

    @GetMapping
    public List<AdminMemberResponse> findMembers(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "nickname", required = false) String nickname,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "status", required = false) MemberStatus status,
            @RequestParam(value = "preferredLanguage", required = false) MemberPreferredLanguage preferredLanguage
    ) {
        return adminMemberManagementService.findMembers(
                adminSessionService.requirePrincipal(authorization),
                name,
                nickname,
                email,
                status,
                preferredLanguage
        );
    }

    @PatchMapping("/{memberId}/suspend")
    public AdminMemberResponse suspendMember(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long memberId,
            @RequestBody AdminMemberStatusChangeRequest request
    ) {
        return adminMemberManagementService.suspendMember(
                adminSessionService.requirePrincipal(authorization),
                memberId,
                request
        );
    }

    @PatchMapping("/{memberId}/reactivate")
    public AdminMemberResponse reactivateMember(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long memberId,
            @RequestBody AdminMemberStatusChangeRequest request
    ) {
        return adminMemberManagementService.reactivateMember(
                adminSessionService.requirePrincipal(authorization),
                memberId,
                request
        );
    }
}
