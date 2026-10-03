package com.lindyhopseoul.backend.diagnostics;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

public final class SafeDiagnostics {
    private static final Set<String> ROUTES = Set.of(("api diagnostics client-errors auth me logout login oauth success error oauth2 authorization code google admin members settings messages unread-count lesson-notices applied-schedule-item-ids applied-class-ids class-applications public schedules corkboard corkboards current archive notes events lessons applications teachers notices read privacy my-classes assets").split(" "));
    private SafeDiagnostics() {}

    public static String path(String value) {
        if (value == null) return "/unknown";
        String path = value.split("[?#]", 2)[0];
        return Arrays.stream(path.split("/", -1))
                .map(part -> part.isEmpty() || ROUTES.contains(part) ? part : ":id")
                .collect(Collectors.joining("/"));
    }

    // Exception messages (especially SQL and OAuth messages) can contain PII.
    // Keep exception classes and application stack locations, never messages.
    public static String exception(Throwable error) {
        StringBuilder result = new StringBuilder();
        for (int depth = 0; error != null && depth < 5; depth++, error = error.getCause()) {
            result.append(error.getClass().getSimpleName()).append(' ');
            Arrays.stream(error.getStackTrace())
                    .filter(frame -> frame.getClassName().startsWith("com.lindyhopseoul."))
                    .limit(12).forEach(frame -> result.append(frame.getClassName()).append('.')
                            .append(frame.getMethodName()).append(':').append(frame.getLineNumber()).append(' '));
        }
        return result.toString();
    }
}
