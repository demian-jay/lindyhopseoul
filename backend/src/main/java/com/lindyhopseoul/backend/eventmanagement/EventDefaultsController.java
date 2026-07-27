package com.lindyhopseoul.backend.eventmanagement;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminRole;
import com.lindyhopseoul.backend.admin.AdminSessionService;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EventDefaultsController {

    private final AdminSessionService adminSessionService;
    private final EventDefaultsService eventDefaultsService;

    public EventDefaultsController(
            AdminSessionService adminSessionService,
            EventDefaultsService eventDefaultsService
    ) {
        this.adminSessionService = adminSessionService;
        this.eventDefaultsService = eventDefaultsService;
    }

    /**
     * Readable by anyone who may register an event, which includes staff: this is
     * what the registration form fills itself in from, so restricting it to the
     * accounts allowed to *edit* the defaults would leave staff with a blank form.
     */
    @GetMapping("/api/admin/event-defaults")
    public EventDefaultsResponse findAll(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        AdminPrincipal actor = adminSessionService.requirePrincipal(authorization);
        if (!actor.canManageEvents()) {
            throw new ForbiddenException("Event management permission is required.");
        }
        return eventDefaultsService.findAll();
    }

    /**
     * Super admin only. Editing a default changes what every later registration
     * starts from, which is a wider blast radius than registering one event.
     */
    @PutMapping("/api/admin/event-defaults/{eventType}")
    public EventTypeDefaultResponse update(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable EventType eventType,
            @Valid @RequestBody EventTypeDefaultRequest request
    ) {
        AdminPrincipal actor = adminSessionService.requirePrincipal(authorization);
        if (!actor.hasRole(AdminRole.SUPER_ADMIN)) {
            throw new ForbiddenException("Super admin permission is required.");
        }
        return eventDefaultsService.update(eventType, request);
    }
}
