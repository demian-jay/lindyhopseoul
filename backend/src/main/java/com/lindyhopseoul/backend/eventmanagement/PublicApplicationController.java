package com.lindyhopseoul.backend.eventmanagement;

import com.lindyhopseoul.backend.auth.CurrentMemberService;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PublicApplicationController {

    private final CurrentMemberService currentMemberService;
    private final EventApplicationService eventApplicationService;

    public PublicApplicationController(
            CurrentMemberService currentMemberService,
            EventApplicationService eventApplicationService
    ) {
        this.currentMemberService = currentMemberService;
        this.eventApplicationService = eventApplicationService;
    }

    @PostMapping("/api/public/applications")
    @ResponseStatus(HttpStatus.CREATED)
    public EventApplicationResponse create(
            HttpServletRequest httpRequest,
            @Valid @RequestBody EventApplicationCreateRequest request
    ) {
        return eventApplicationService.create(
                request,
                currentMemberService.findCurrentMember(httpRequest).orElse(null)
        );
    }
}
