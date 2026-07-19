package com.lindyhopseoul.backend.eventmanagement;

import java.util.List;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminSessionService;
import com.lindyhopseoul.backend.auth.CurrentMemberService;
import com.lindyhopseoul.backend.member.Member;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
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
public class LessonNoticeController {

    private final AdminSessionService adminSessionService;
    private final CurrentMemberService currentMemberService;
    private final LessonNoticeService lessonNoticeService;

    public LessonNoticeController(
            AdminSessionService adminSessionService,
            CurrentMemberService currentMemberService,
            LessonNoticeService lessonNoticeService
    ) {
        this.adminSessionService = adminSessionService;
        this.currentMemberService = currentMemberService;
        this.lessonNoticeService = lessonNoticeService;
    }

    @GetMapping("/api/admin/lessons/{lessonId}/notices")
    public List<LessonNoticeResponse> findAdminNotices(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long lessonId
    ) {
        return lessonNoticeService.findAdminNotices(requirePrincipal(authorization), lessonId);
    }

    @PostMapping("/api/admin/lessons/{lessonId}/notices")
    @ResponseStatus(HttpStatus.CREATED)
    public LessonNoticeResponse createAdminNotice(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long lessonId,
            @Valid @RequestBody LessonNoticeCreateRequest request
    ) {
        return lessonNoticeService.createAdminNotice(requirePrincipal(authorization), lessonId, request);
    }

    @PutMapping("/api/admin/lessons/{lessonId}/notices/{noticeId}")
    public LessonNoticeResponse updateAdminNotice(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long lessonId,
            @PathVariable Long noticeId,
            @Valid @RequestBody LessonNoticeCreateRequest request
    ) {
        return lessonNoticeService.updateAdminNotice(requirePrincipal(authorization), lessonId, noticeId, request);
    }

    @DeleteMapping("/api/admin/lessons/{lessonId}/notices/{noticeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAdminNotice(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long lessonId,
            @PathVariable Long noticeId
    ) {
        lessonNoticeService.deleteAdminNotice(requirePrincipal(authorization), lessonId, noticeId);
    }

    @GetMapping("/api/members/me/lessons/{lessonId}/notices")
    public List<LessonNoticeResponse> findMemberNotices(
            HttpServletRequest request,
            @PathVariable Long lessonId
    ) {
        return lessonNoticeService.findMemberNotices(requireMember(request), lessonId);
    }

    @GetMapping("/api/members/me/lesson-notices/unread-count")
    public LessonNoticeUnreadCountResponse findMemberUnreadCount(HttpServletRequest request) {
        return lessonNoticeService.findMemberUnreadCount(requireMember(request));
    }

    @PatchMapping("/api/members/me/lessons/{lessonId}/notices/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markMemberNoticesRead(
            HttpServletRequest request,
            @PathVariable Long lessonId
    ) {
        lessonNoticeService.markMemberNoticesRead(requireMember(request), lessonId);
    }

    private AdminPrincipal requirePrincipal(String authorization) {
        return adminSessionService.requirePrincipal(authorization);
    }

    private Member requireMember(HttpServletRequest request) {
        return currentMemberService.requireCurrentMember(request);
    }
}
