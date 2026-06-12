package com.lindyhopseoul.backend.eventmanagement;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PublicScheduleController {

    private final PublicScheduleService publicScheduleService;

    public PublicScheduleController(PublicScheduleService publicScheduleService) {
        this.publicScheduleService = publicScheduleService;
    }

    @GetMapping("/api/public/schedules")
    public List<PublicScheduleItemResponse> findOpenSchedules(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return publicScheduleService.findOpenSchedules(from, to);
    }
}
