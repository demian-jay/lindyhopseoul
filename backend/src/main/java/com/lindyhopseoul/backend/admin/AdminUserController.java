package com.lindyhopseoul.backend.admin;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminSessionService adminSessionService;
    private final AdminAccountService adminAccountService;

    public AdminUserController(
            AdminSessionService adminSessionService,
            AdminAccountService adminAccountService
    ) {
        this.adminSessionService = adminSessionService;
        this.adminAccountService = adminAccountService;
    }

    @GetMapping("/admins")
    public List<AdminAccountResponse> findAdminUsers(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return adminAccountService.findAdminUsers(adminSessionService.requirePrincipal(authorization));
    }

    @PostMapping("/admins")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminAccountResponse createAdminUser(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody AdminAccountCreateRequest request
    ) {
        return adminAccountService.createAdminUser(adminSessionService.requirePrincipal(authorization), request);
    }

    @PutMapping("/admins/{adminUserCd}")
    public AdminAccountResponse updateAdminUser(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String adminUserCd,
            @Valid @RequestBody AdminAccountUpdateRequest request
    ) {
        return adminAccountService.updateAdminUser(
                adminSessionService.requirePrincipal(authorization),
                adminUserCd,
                request
        );
    }

    @PatchMapping("/admins/{adminUserCd}/deactivate")
    public AdminAccountResponse deactivateAdminUser(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String adminUserCd
    ) {
        return adminAccountService.deactivateAdminUser(adminSessionService.requirePrincipal(authorization), adminUserCd);
    }

    @GetMapping("/teachers")
    public List<TeacherAccountResponse> findTeacherUsers(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return adminAccountService.findTeacherUsers(adminSessionService.requirePrincipal(authorization));
    }

    @PostMapping("/teachers")
    @ResponseStatus(HttpStatus.CREATED)
    public TeacherAccountResponse createTeacherUser(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody TeacherAccountCreateRequest request
    ) {
        return adminAccountService.createTeacherUser(adminSessionService.requirePrincipal(authorization), request);
    }

    @PutMapping("/teachers/{teacherUserCd}")
    public TeacherAccountResponse updateTeacherUser(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String teacherUserCd,
            @Valid @RequestBody TeacherAccountUpdateRequest request
    ) {
        return adminAccountService.updateTeacherUser(
                adminSessionService.requirePrincipal(authorization),
                teacherUserCd,
                request
        );
    }

    @PatchMapping("/teachers/{teacherUserCd}/deactivate")
    public TeacherAccountResponse deactivateTeacherUser(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String teacherUserCd
    ) {
        return adminAccountService.deactivateTeacherUser(
                adminSessionService.requirePrincipal(authorization),
                teacherUserCd
        );
    }
}
