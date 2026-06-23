package com.lindyhopseoul.backend.eventmanagement;

import java.util.List;

import com.lindyhopseoul.backend.auth.CurrentMemberService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/members/me")
public class MemberClassApplicationController {

    private final CurrentMemberService currentMemberService;
    private final MemberClassApplicationService memberClassApplicationService;

    public MemberClassApplicationController(
            CurrentMemberService currentMemberService,
            MemberClassApplicationService memberClassApplicationService
    ) {
        this.currentMemberService = currentMemberService;
        this.memberClassApplicationService = memberClassApplicationService;
    }

    @GetMapping("/class-applications")
    public List<MemberClassApplicationResponse> findMyClassApplications(
            HttpServletRequest request,
            @RequestParam(required = false) String language
    ) {
        return memberClassApplicationService.findMyApplications(
                currentMemberService.requireCurrentMemberId(request),
                language
        );
    }

    @GetMapping("/applied-class-ids")
    public List<Long> findMyAppliedClassIds(HttpServletRequest request) {
        return memberClassApplicationService.findAppliedClassIds(
                currentMemberService.requireCurrentMemberId(request)
        );
    }

    @GetMapping("/applied-schedule-item-ids")
    public List<String> findMyAppliedScheduleItemIds(HttpServletRequest request) {
        return memberClassApplicationService.findAppliedScheduleItemIds(
                currentMemberService.requireCurrentMemberId(request)
        );
    }
}
