package com.lindyhopseoul.backend.membermessage;

import java.util.List;

public record MemberMessageThreadResponse(
        Long threadId,
        List<MemberMessageResponse> messages
) {

    public static MemberMessageThreadResponse empty() {
        return new MemberMessageThreadResponse(null, List.of());
    }
}
