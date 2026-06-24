package com.lindyhopseoul.backend.member;

record AdminMemberApplicationSummary(
        long totalApplicationCount,
        long level1ApplicationCount,
        long level2ApplicationCount,
        long level3ApplicationCount,
        long level4ApplicationCount,
        long workshopApplicationCount
) {

    static AdminMemberApplicationSummary empty() {
        return new AdminMemberApplicationSummary(0, 0, 0, 0, 0, 0);
    }
}
