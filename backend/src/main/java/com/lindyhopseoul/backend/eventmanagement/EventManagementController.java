package com.lindyhopseoul.backend.eventmanagement;

import java.time.LocalDate;
import java.util.List;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminSessionService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EventManagementController {

    private final AdminSessionService adminSessionService;
    private final EventManagementService eventManagementService;

    public EventManagementController(
            AdminSessionService adminSessionService,
            EventManagementService eventManagementService
    ) {
        this.adminSessionService = adminSessionService;
        this.eventManagementService = eventManagementService;
    }

    @GetMapping("/api/admin/events")
    public List<EventResponse> findEvents(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) EventType eventType,
            @RequestParam(required = false) EventStatus status
    ) {
        return eventManagementService.findEvents(requirePrincipal(authorization), from, to, eventType, status);
    }

    @GetMapping("/api/admin/events/{eventId}")
    public EventResponse findEvent(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long eventId
    ) {
        return eventManagementService.findEvent(requirePrincipal(authorization), eventId);
    }

    @PostMapping("/api/admin/events")
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse createEvent(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody EventRequest request
    ) {
        return eventManagementService.createEvent(requirePrincipal(authorization), request);
    }

    @PutMapping("/api/admin/events/{eventId}")
    public EventResponse updateEvent(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long eventId,
            @Valid @RequestBody EventRequest request
    ) {
        return eventManagementService.updateEvent(requirePrincipal(authorization), eventId, request);
    }

    @DeleteMapping("/api/admin/events/{eventId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvent(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long eventId
    ) {
        eventManagementService.deleteEvent(requirePrincipal(authorization), eventId);
    }

    @GetMapping("/api/admin/events/{eventId}/lessons")
    public List<LessonResponse> findLessons(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long eventId
    ) {
        return eventManagementService.findLessons(requirePrincipal(authorization), eventId);
    }

    @PostMapping("/api/admin/events/{eventId}/lessons")
    @ResponseStatus(HttpStatus.CREATED)
    public LessonResponse createLesson(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long eventId,
            @Valid @RequestBody LessonRequest request
    ) {
        return eventManagementService.createLesson(requirePrincipal(authorization), eventId, request);
    }

    @PutMapping("/api/admin/lessons/{lessonId}")
    public LessonResponse updateLesson(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long lessonId,
            @Valid @RequestBody LessonRequest request
    ) {
        return eventManagementService.updateLesson(requirePrincipal(authorization), lessonId, request);
    }

    @DeleteMapping("/api/admin/lessons/{lessonId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteLesson(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long lessonId
    ) {
        eventManagementService.deleteLesson(requirePrincipal(authorization), lessonId);
    }

    @PatchMapping("/api/admin/event-applications/{applicationId}/remove")
    public EventApplicationResponse removeEventApplication(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long applicationId,
            @RequestBody(required = false) EventApplicationRemoveRequest request
    ) {
        return eventManagementService.removeEventApplication(requirePrincipal(authorization), applicationId, request);
    }

    @GetMapping("/api/admin/teachers/active")
    public List<ActiveTeacherResponse> findActiveTeachers(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return eventManagementService.findActiveTeachers(requirePrincipal(authorization));
    }

    @GetMapping("/api/admin/message-templates")
    public List<MessageTemplateResponse> findMessageTemplates(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return eventManagementService.findMessageTemplates(requirePrincipal(authorization));
    }

    @GetMapping("/api/admin/message-templates/{templateId}")
    public MessageTemplateResponse findMessageTemplate(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long templateId
    ) {
        return eventManagementService.findMessageTemplate(requirePrincipal(authorization), templateId);
    }

    @PostMapping("/api/admin/message-templates")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageTemplateResponse createMessageTemplate(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody MessageTemplateRequest request
    ) {
        return eventManagementService.createMessageTemplate(requirePrincipal(authorization), request);
    }

    @PutMapping("/api/admin/message-templates/{templateId}")
    public MessageTemplateResponse updateMessageTemplate(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long templateId,
            @Valid @RequestBody MessageTemplateRequest request
    ) {
        return eventManagementService.updateMessageTemplate(requirePrincipal(authorization), templateId, request);
    }

    @DeleteMapping("/api/admin/message-templates/{templateId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMessageTemplate(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long templateId
    ) {
        eventManagementService.deleteMessageTemplate(requirePrincipal(authorization), templateId);
    }

    @PostMapping("/api/admin/message-templates/{templateId}/render")
    public MessageRenderResponse renderMessageTemplate(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long templateId,
            @Valid @RequestBody MessageRenderRequest request
    ) {
        return eventManagementService.renderMessageTemplate(requirePrincipal(authorization), templateId, request);
    }

    private AdminPrincipal requirePrincipal(String authorization) {
        return adminSessionService.requirePrincipal(authorization);
    }
}
