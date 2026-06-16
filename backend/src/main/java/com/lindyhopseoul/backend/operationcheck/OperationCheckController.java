package com.lindyhopseoul.backend.operationcheck;

import java.util.List;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminSessionService;
import jakarta.validation.Valid;
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
@RequestMapping("/api/admin/operation-checks")
public class OperationCheckController {

    private final AdminSessionService adminSessionService;
    private final OperationCheckService operationCheckService;

    public OperationCheckController(
            AdminSessionService adminSessionService,
            OperationCheckService operationCheckService
    ) {
        this.adminSessionService = adminSessionService;
        this.operationCheckService = operationCheckService;
    }

    @GetMapping("/assignees")
    public List<OperationCheckAssigneeResponse> findAssignees(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return operationCheckService.findAssignees(principal(authorization));
    }

    @GetMapping("/summary")
    public OperationCheckSummaryResponse findSummary(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return operationCheckService.findSummary(principal(authorization));
    }

    @GetMapping
    public List<OperationCheckItemResponse> findItems(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(defaultValue = "OPEN") String status
    ) {
        return operationCheckService.findItems(principal(authorization), status);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OperationCheckItemResponse create(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody OperationCheckCreateRequest request
    ) {
        return operationCheckService.create(principal(authorization), request);
    }

    @PatchMapping("/{id}/done")
    public OperationCheckItemResponse markDone(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @Valid @RequestBody OperationCheckDoneRequest request
    ) {
        return operationCheckService.markDone(principal(authorization), id, request);
    }

    private AdminPrincipal principal(String authorization) {
        return adminSessionService.requirePrincipal(authorization);
    }
}
