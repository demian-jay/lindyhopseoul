package com.lindyhopseoul.backend.membermessage;

import java.util.List;

public record AdminMessageThreadDetailResponse(
        Long threadId,
        AdminMessageThreadMemberResponse member,
        List<MemberMessageResponse> messages
) {
}
