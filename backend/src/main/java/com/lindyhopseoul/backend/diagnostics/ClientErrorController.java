package com.lindyhopseoul.backend.diagnostics;

import java.util.HashSet;
import java.util.Set;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/diagnostics")
public class ClientErrorController {
    private static final Logger log = LoggerFactory.getLogger(ClientErrorController.class);
    private final Set<String> seen = new HashSet<>();
    private long windowStart = System.currentTimeMillis();
    private int received;

    @PostMapping(value = "/client-errors", consumes = "application/json")
    public synchronized ResponseEntity<Void> report(@Valid @RequestBody ClientError error) {
        long now = System.currentTimeMillis();
        if (now - windowStart >= 60_000) {
            windowStart = now; received = 0; seen.clear();
        }
        if (++received > 300) return ResponseEntity.status(429).build();
        if (seen.add(error.eventId())) {
            log.warn("CLIENT_ERROR eventId={} requestId={} kind={} errorType={} page={} endpoint={} status={} apiRequestId={} build={} frames={}",
                    error.eventId(), MDC.get("requestId"), error.kind(), error.errorType(),
                    SafeDiagnostics.path(error.page()), SafeDiagnostics.path(error.endpoint()), error.status(),
                    error.requestId(), error.build(), error.frames().replace('\n', '|'));
        }
        return ResponseEntity.accepted().build();
    }

    public record ClientError(
            @NotNull @Size(min = 1, max = 80) @Pattern(regexp = "[A-Za-z0-9-]+") String eventId,
            @NotNull @Pattern(regexp = "javascript|resource|promise|api|network|react|startup|handled|oauth|serviceworker") String kind,
            @NotNull @Pattern(regexp = "[A-Za-z][A-Za-z0-9]{0,60}") String errorType,
            @NotNull @Size(max = 2000) @Pattern(regexp = "[A-Za-z0-9_.:\\-\\n]*") String frames,
            @NotNull @Size(max = 200) @Pattern(regexp = "[/a-z:\\-]*") String page,
            @NotNull @Size(max = 200) @Pattern(regexp = "[/a-z:\\-]*") String endpoint,
            @Min(0) @Max(599) int status,
            @NotNull @Pattern(regexp = "|[a-f0-9-]{36}") String requestId,
            @NotNull @Size(max = 80) @Pattern(regexp = "development|[0-9A-Za-z :·.-]+") String build
    ) {}
}
