package com.lindyhopseoul.backend.member;

import com.lindyhopseoul.backend.auth.CurrentMemberService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/members/me/settings")
public class MemberSettingsController {

    private final CurrentMemberService currentMemberService;
    private final MemberSettingsService memberSettingsService;

    public MemberSettingsController(
            CurrentMemberService currentMemberService,
            MemberSettingsService memberSettingsService
    ) {
        this.currentMemberService = currentMemberService;
        this.memberSettingsService = memberSettingsService;
    }

    @GetMapping
    public MemberSettingsResponse findSettings(HttpServletRequest request) {
        return memberSettingsService.findSettings(currentMemberService.requireCurrentMemberId(request));
    }

    @PatchMapping
    public MemberSettingsResponse updateSettings(
            HttpServletRequest request,
            @RequestBody(required = false) MemberSettingsUpdateRequest updateRequest
    ) {
        return memberSettingsService.updateSettings(
                currentMemberService.requireCurrentMemberId(request),
                updateRequest
        );
    }
}
