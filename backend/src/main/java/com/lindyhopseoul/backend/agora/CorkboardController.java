package com.lindyhopseoul.backend.agora;

import java.util.List;

import com.lindyhopseoul.backend.auth.CurrentMemberService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/agora")
public class CorkboardController {

    private final CorkboardService corkboardService;
    private final CurrentMemberService currentMemberService;

    public CorkboardController(
            CorkboardService corkboardService,
            CurrentMemberService currentMemberService
    ) {
        this.corkboardService = corkboardService;
        this.currentMemberService = currentMemberService;
    }

    @GetMapping("/corkboards/current")
    public CorkboardCollectionResponse findCurrent(HttpServletRequest request) {
        Long currentMemberId = currentMemberService.findCurrentMember(request)
                .map(member -> member.getId())
                .orElse(null);
        return corkboardService.findCurrentCorkboards(currentMemberId);
    }

    @GetMapping("/corkboards/archive")
    public List<CorkboardArchivePeriodResponse> findArchivePeriods() {
        return corkboardService.findArchivePeriods();
    }

    @GetMapping("/corkboards")
    public CorkboardCollectionResponse findByPeriod(HttpServletRequest request, @RequestParam String periodKey) {
        Long currentMemberId = currentMemberService.findCurrentMember(request)
                .map(member -> member.getId())
                .orElse(null);
        return corkboardService.findPeriod(periodKey, currentMemberId);
    }

    @PostMapping("/corkboard-notes")
    @ResponseStatus(HttpStatus.CREATED)
    public CorkboardCollectionResponse createMemberNote(
            HttpServletRequest request,
            @RequestBody(required = false) CorkboardNoteCreateRequest createRequest
    ) {
        return corkboardService.createMemberNote(
                currentMemberService.requireCurrentMemberId(request),
                createRequest
        );
    }

    @PatchMapping("/corkboard-notes/{id}/position")
    public CorkboardNoteResponse updateMemberNotePosition(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestBody(required = false) CorkboardNotePositionRequest positionRequest
    ) {
        return corkboardService.updateMemberNotePosition(
                currentMemberService.requireCurrentMemberId(request),
                id,
                positionRequest
        );
    }
}
