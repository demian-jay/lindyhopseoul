package com.lindyhopseoul.backend.admin;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/google-links")
public class AdminGoogleLinkController {

    private final AdminSessionService adminSessionService;
    private final AdminGoogleLinkService adminGoogleLinkService;

    public AdminGoogleLinkController(
            AdminSessionService adminSessionService,
            AdminGoogleLinkService adminGoogleLinkService
    ) {
        this.adminSessionService = adminSessionService;
        this.adminGoogleLinkService = adminGoogleLinkService;
    }

    @GetMapping
    public List<AdminGoogleLinkResponse> findLinks(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return adminGoogleLinkService.findLinks(principal(authorization));
    }

    @PutMapping("/{userId}")
    public AdminGoogleLinkResponse link(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String userId,
            @Valid @RequestBody AdminGoogleLinkRequest request
    ) {
        return adminGoogleLinkService.link(principal(authorization), userId, request.memberId());
    }

    @DeleteMapping("/{userId}")
    public AdminGoogleLinkResponse unlink(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String userId
    ) {
        return adminGoogleLinkService.unlink(principal(authorization), userId);
    }

    private AdminPrincipal principal(String authorization) {
        return adminSessionService.requirePrincipal(authorization);
    }
}
