package com.lindyhopseoul.backend.eventmanagement;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PublicApplicationController {

    private final EventApplicationService eventApplicationService;

    public PublicApplicationController(EventApplicationService eventApplicationService) {
        this.eventApplicationService = eventApplicationService;
    }

    @PostMapping("/api/public/applications")
    @ResponseStatus(HttpStatus.CREATED)
    public EventApplicationResponse create(@Valid @RequestBody EventApplicationCreateRequest request) {
        return eventApplicationService.create(request);
    }
}
