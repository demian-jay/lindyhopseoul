package com.lindyhopseoul.backend.agora;

import java.util.List;

public record AdminCorkboardManagementResponse(
        List<AdminCorkboardPeriodResponse> periods,
        CorkboardCollectionResponse selected,
        AdminCorkboardPeriodResponse current
) {
}
