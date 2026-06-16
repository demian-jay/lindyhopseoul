package com.lindyhopseoul.backend.operationcheck;

import com.lindyhopseoul.backend.admin.UserAccount;

public record OperationCheckAssigneeResponse(
        String userId,
        String name
) {

    public static OperationCheckAssigneeResponse from(UserAccount user) {
        return new OperationCheckAssigneeResponse(user.getUserId(), user.getName());
    }
}
