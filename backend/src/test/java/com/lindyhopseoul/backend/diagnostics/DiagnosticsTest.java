package com.lindyhopseoul.backend.diagnostics;

import static org.assertj.core.api.Assertions.assertThat;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class DiagnosticsTest {
    @Test
    void rollingLogConfigurationInitializesWithoutErrors() throws Exception {
        var context = new ch.qos.logback.classic.LoggerContext();
        try {
            var configurator = new ch.qos.logback.classic.joran.JoranConfigurator();
            configurator.setContext(context);
            configurator.doConfigure(getClass().getResource("/logback-spring.xml"));
            assertThat(context.getStatusManager().getCopyOfStatusList())
                    .noneMatch(status -> status.getLevel() == ch.qos.logback.core.status.Status.ERROR);
            var appender = context.getLogger("com.lindyhopseoul.backend.diagnostics").getAppender("DIAGNOSTICS");
            assertThat(appender).isNotNull();
            assertThat(appender.isStarted()).isTrue();
        } finally { context.stop(); }
    }
    @Test
    void realHttpEndpointAcceptsSafeReportAndRejectsInvalidJson() throws Exception {
        var mvc = org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup(new ClientErrorController())
                .setControllerAdvice(new com.lindyhopseoul.backend.exception.GlobalExceptionHandler())
                .addFilters(new RequestDiagnosticsFilter()).build();
        String body = """
                {"eventId":"test-http","kind":"react","errorType":"TypeError","frames":"main-a.js:1:9",
                "page":"/oauth/success","endpoint":"","status":0,"requestId":"","build":"development"}
                """;
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/diagnostics/client-errors")
                .contentType("application/json").content(body))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isAccepted())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().exists("X-Request-ID"));
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/diagnostics/client-errors")
                .contentType("application/json").content("{"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isBadRequest());
    }
    @Test
    void stripsPersonalPathsQueriesAndExceptionMessages() {
        assertThat(SafeDiagnostics.path("/api/members/someone@example.com/settings?token=secret"))
                .isEqualTo("/api/members/:id/settings");
        assertThat(SafeDiagnostics.exception(new IllegalStateException("email=someone@example.com token=secret")))
                .contains("IllegalStateException").doesNotContain("someone", "secret", "email=");
    }

    @Test
    void attachesGeneratedIdAndPreservesResponse() throws Exception {
        var response = new MockHttpServletResponse();
        new RequestDiagnosticsFilter().doFilter(new MockHttpServletRequest("GET", "/api/auth/me"), response,
                (request, result) -> ((MockHttpServletResponse) result).setStatus(401));
        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getHeader("X-Request-ID")).matches("[a-f0-9-]{36}");
        assertThat(org.slf4j.MDC.get("requestId")).isNull();
    }

    @Test
    void rejectsOversizedReportsBeforeController() throws Exception {
        var request = new MockHttpServletRequest("POST", "/api/diagnostics/client-errors");
        request.setContent(new byte[16385]);
        var response = new MockHttpServletResponse();
        new RequestDiagnosticsFilter().doFilter(request, response, (req, res) -> { throw new AssertionError("called"); });
        assertThat(response.getStatus()).isEqualTo(413);
    }

    @Test
    void boundsIngressEvenForInvalidReports() throws Exception {
        var filter = new RequestDiagnosticsFilter();
        for (int i = 0; i < 300; i++) {
            var response = new MockHttpServletResponse();
            filter.doFilter(new MockHttpServletRequest("POST", "/api/diagnostics/client-errors"), response, (req, res) -> {});
            assertThat(response.getStatus()).isEqualTo(200);
        }
        var response = new MockHttpServletResponse();
        filter.doFilter(new MockHttpServletRequest("POST", "/api/diagnostics/client-errors"), response,
                (req, res) -> { throw new AssertionError("called"); });
        assertThat(response.getStatus()).isEqualTo(429);
    }

    @Test
    void acceptsSafeReportAndRejectsLogInjection() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            var report = new ClientErrorController.ClientError("test-event", "react", "TypeError", "index-a.js:1:20",
                    "/oauth/success", "", 0, "", "development");
            assertThat(validator.validate(report)).isEmpty();
            assertThat(new ClientErrorController().report(report).getStatusCode().value()).isEqualTo(202);
            var unsafe = new ClientErrorController.ClientError("bad\nforged", "react", "TypeError", "email@example.com",
                    "/", "", 0, "", "development");
            assertThat(validator.validate(unsafe)).isNotEmpty();
        }
    }
}
