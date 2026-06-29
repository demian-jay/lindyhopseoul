package com.lindyhopseoul.backend.agora;

import java.util.List;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminSessionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AgoraNoticeController {

    private final AdminSessionService adminSessionService;
    private final AgoraNoticeService agoraNoticeService;

    public AgoraNoticeController(AdminSessionService adminSessionService, AgoraNoticeService agoraNoticeService) {
        this.adminSessionService = adminSessionService;
        this.agoraNoticeService = agoraNoticeService;
    }

    @GetMapping("/api/agora/notices")
    public List<AgoraNoticeResponse> findVisibleNotices() {
        return agoraNoticeService.findVisibleNotices();
    }

    @GetMapping("/api/admin/agora/notices")
    public List<AgoraNoticeResponse> findAdminNotices(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return agoraNoticeService.findAdminNotices(requirePrincipal(authorization));
    }

    @PostMapping("/api/admin/agora/notices")
    @ResponseStatus(HttpStatus.CREATED)
    public AgoraNoticeResponse createAdminNotice(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody AgoraNoticeRequest request
    ) {
        return agoraNoticeService.createAdminNotice(requirePrincipal(authorization), request);
    }

    @PutMapping("/api/admin/agora/notices/{id}")
    public AgoraNoticeResponse updateAdminNotice(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @Valid @RequestBody AgoraNoticeRequest request
    ) {
        return agoraNoticeService.updateAdminNotice(requirePrincipal(authorization), id, request);
    }

    @PatchMapping("/api/admin/agora/notices/{id}/visibility")
    public AgoraNoticeResponse updateVisibility(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @Valid @RequestBody AgoraNoticeVisibilityRequest request
    ) {
        return agoraNoticeService.updateVisibility(requirePrincipal(authorization), id, request);
    }

    private AdminPrincipal requirePrincipal(String authorization) {
        return adminSessionService.requirePrincipal(authorization);
    }
}
