package com.lindyhopseoul.backend.agora;

import java.util.List;

import com.lindyhopseoul.backend.admin.AdminSessionService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/agora")
public class AdminCorkboardController {

    private final AdminSessionService adminSessionService;
    private final CorkboardService corkboardService;

    public AdminCorkboardController(
            AdminSessionService adminSessionService,
            CorkboardService corkboardService
    ) {
        this.adminSessionService = adminSessionService;
        this.corkboardService = corkboardService;
    }

    @GetMapping("/corkboards")
    public AdminCorkboardManagementResponse findCorkboards(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(required = false) String periodKey
    ) {
        return corkboardService.findAdminCorkboards(
                adminSessionService.requirePrincipal(authorization),
                periodKey
        );
    }

    @GetMapping("/corkboard-periods")
    public List<AdminCorkboardPeriodResponse> findPeriods(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return corkboardService.findAdminPeriods(
                adminSessionService.requirePrincipal(authorization)
        );
    }

    @GetMapping("/corkboard-periods/current")
    public AdminCorkboardPeriodResponse findCurrentPeriod(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return corkboardService.findCurrentAdminPeriod(
                adminSessionService.requirePrincipal(authorization)
        );
    }

    @PostMapping("/corkboard-periods")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminCorkboardManagementResponse createPeriod(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody(required = false) AdminCorkboardPeriodCreateRequest request
    ) {
        return corkboardService.createPeriod(
                adminSessionService.requirePrincipal(authorization),
                request
        );
    }

    @PatchMapping("/corkboard-periods/{periodKey}")
    public AdminCorkboardManagementResponse updatePeriod(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String periodKey,
            @RequestBody(required = false) AdminCorkboardPeriodUpdateRequest request
    ) {
        return corkboardService.updatePeriod(
                adminSessionService.requirePrincipal(authorization),
                periodKey,
                request
        );
    }

    @PatchMapping("/corkboard-periods/{periodKey}/archive")
    public AdminCorkboardManagementResponse archivePeriod(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String periodKey
    ) {
        return corkboardService.archivePeriod(
                adminSessionService.requirePrincipal(authorization),
                periodKey
        );
    }

    @PostMapping("/corkboard-notes")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminCorkboardManagementResponse createOfficialNote(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody(required = false) AdminCorkboardNoteCreateRequest request
    ) {
        return corkboardService.createOfficialNote(
                adminSessionService.requirePrincipal(authorization),
                request
        );
    }

    @PatchMapping("/corkboard-notes/{id}/hidden")
    public CorkboardNoteResponse updateHidden(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @RequestBody(required = false) CorkboardNoteHiddenRequest request
    ) {
        return corkboardService.updateHidden(
                adminSessionService.requirePrincipal(authorization),
                id,
                request
        );
    }

    @PatchMapping("/corkboard-notes/{id}/position")
    public CorkboardNoteResponse updatePosition(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @RequestBody(required = false) CorkboardNotePositionRequest request
    ) {
        return corkboardService.updateAdminNotePosition(
                adminSessionService.requirePrincipal(authorization),
                id,
                request
        );
    }

    @PatchMapping("/corkboard-notes/{id}/content")
    public CorkboardNoteResponse updateContent(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @RequestBody(required = false) CorkboardNoteContentRequest request
    ) {
        return corkboardService.updateAdminOfficialNoteContent(
                adminSessionService.requirePrincipal(authorization),
                id,
                request
        );
    }
}
