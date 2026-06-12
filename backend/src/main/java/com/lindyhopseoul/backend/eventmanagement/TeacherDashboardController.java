package com.lindyhopseoul.backend.eventmanagement;

import java.time.LocalDate;
import java.util.List;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminSessionService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TeacherDashboardController {

    private final AdminSessionService adminSessionService;
    private final EventManagementService eventManagementService;

    public TeacherDashboardController(
            AdminSessionService adminSessionService,
            EventManagementService eventManagementService
    ) {
        this.adminSessionService = adminSessionService;
        this.eventManagementService = eventManagementService;
    }

    @GetMapping({"/api/teacher/dashboard", "/api/teacher/dashboard/active-lessons", "/api/teacher/dashboard/today"})
    public TeacherDashboardResponse findActiveLessons(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return eventManagementService.findTeacherDashboard(requirePrincipal(authorization));
    }

    @GetMapping("/api/teacher/dashboard/my-lessons")
    public List<TeacherDashboardLessonResponse> findMyLessons(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "PUBLISHED") LessonStatus status
    ) {
        return eventManagementService.findTeacherLessons(requirePrincipal(authorization), from, to, status);
    }

    private AdminPrincipal requirePrincipal(String authorization) {
        return adminSessionService.requirePrincipal(authorization);
    }
}
