package com.lindyhopseoul.backend.diagnostics;

import java.io.IOException;
import java.util.UUID;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RequestDiagnosticsFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(RequestDiagnosticsFilter.class);
    private long windowStart = System.currentTimeMillis();
    private int reports;

    private synchronized boolean allowReport() {
        long now = System.currentTimeMillis();
        if (now - windowStart >= 60_000) { windowStart = now; reports = 0; }
        return ++reports <= 300;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String requestId = UUID.randomUUID().toString();
        response.setHeader("X-Request-ID", requestId);
        MDC.put("requestId", requestId);
        long start = System.nanoTime();
        try {
            if (request.getRequestURI().equals("/api/diagnostics/client-errors") && "POST".equals(request.getMethod())) {
                if (!allowReport()) { response.setStatus(429); return; }
                if (request.getContentLengthLong() > 16384) { response.setStatus(413); return; }
            }
            chain.doFilter(request, response);
        } catch (IOException | ServletException | RuntimeException error) {
            log.error("REQUEST_EXCEPTION requestId={} method={} path={} exception={}", requestId,
                    request.getMethod(), SafeDiagnostics.path(request.getRequestURI()), SafeDiagnostics.exception(error));
            throw error;
        } finally {
            String path = SafeDiagnostics.path(request.getRequestURI());
            long duration = (System.nanoTime() - start) / 1_000_000;
            if (path.equals("/api/diagnostics/client-errors") && response.getStatus() == 429) {
                // Rate-limit floods must not amplify into a log flood.
            } else if (response.getStatus() >= 400) {
                log.warn("REQUEST_FAILED requestId={} method={} path={} status={} durationMs={}",
                        requestId, request.getMethod(), path, response.getStatus(), duration);
            } else if (!path.equals("/api/diagnostics/client-errors")) {
                log.info("REQUEST_COMPLETE requestId={} method={} path={} status={} durationMs={}",
                        requestId, request.getMethod(), path, response.getStatus(), duration);
            }
            MDC.remove("requestId");
        }
    }
}
