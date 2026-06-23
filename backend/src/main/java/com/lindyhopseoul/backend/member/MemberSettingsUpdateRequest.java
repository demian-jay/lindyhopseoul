package com.lindyhopseoul.backend.member;

public record MemberSettingsUpdateRequest(
        String nickname,
        String preferredLanguage
) {
}
