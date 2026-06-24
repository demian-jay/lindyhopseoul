package com.lindyhopseoul.backend.membermessage;

import java.util.List;

public record AdminMemberMessageSendRequest(
        List<Long> memberIds,
        String content
) {
}
