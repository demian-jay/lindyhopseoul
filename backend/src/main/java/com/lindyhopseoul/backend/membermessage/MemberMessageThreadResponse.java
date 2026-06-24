package com.lindyhopseoul.backend.membermessage;

import java.util.List;

public record MemberMessageThreadResponse(
        Long threadId,
        List<MemberMessageResponse> messages,
        boolean unreadByMember,
        long unreadMessageCountForMember
) {

    public static MemberMessageThreadResponse empty() {
        return new MemberMessageThreadResponse(null, List.of(), false, 0);
    }
}
