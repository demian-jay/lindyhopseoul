package com.lindyhopseoul.backend.agora;

import java.util.List;

public record AdminCorkboardManagementResponse(
        List<CorkboardArchivePeriodResponse> periods,
        CorkboardCollectionResponse selected
) {
}
