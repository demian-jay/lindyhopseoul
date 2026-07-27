package com.lindyhopseoul.backend.eventmanagement;

import java.util.List;

/**
 * Everything the registration form needs to fill itself in, in one call: a block
 * per event type plus the floor a lesson falls back to when its pairing defines
 * nothing.
 */
public record EventDefaultsResponse(
        List<EventTypeDefaultResponse> eventTypes,
        LessonDefaultResponse lessonFallback
) {
}
