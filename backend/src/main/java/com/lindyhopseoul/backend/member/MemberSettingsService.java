package com.lindyhopseoul.backend.member;

import com.lindyhopseoul.backend.exception.BadRequestException;
import com.lindyhopseoul.backend.exception.UnauthorizedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MemberSettingsService {

    private final MemberRepository memberRepository;

    public MemberSettingsService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    @Transactional(readOnly = true)
    public MemberSettingsResponse findSettings(Long memberId) {
        return MemberSettingsResponse.from(findMember(memberId));
    }

    @Transactional
    public MemberSettingsResponse updateSettings(Long memberId, MemberSettingsUpdateRequest request) {
        Member member = findMember(memberId);
        String nickname = normalizeNickname(request == null ? null : request.nickname());
        MemberPreferredLanguage preferredLanguage = parsePreferredLanguage(request == null ? null : request.preferredLanguage());

        member.updateSettings(nickname, preferredLanguage);
        return MemberSettingsResponse.from(member);
    }

    MemberSettingsResponse updateSettings(Member member, MemberSettingsUpdateRequest request) {
        String nickname = normalizeNickname(request == null ? null : request.nickname());
        MemberPreferredLanguage preferredLanguage = parsePreferredLanguage(request == null ? null : request.preferredLanguage());

        member.updateSettings(nickname, preferredLanguage);
        return MemberSettingsResponse.from(member);
    }

    private Member findMember(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new UnauthorizedException("Login is required."));
    }

    private String normalizeNickname(String nickname) {
        if (nickname == null) {
            return null;
        }

        String normalized = nickname.trim();
        if (normalized.isBlank()) {
            return null;
        }
        if (normalized.length() < 2 || normalized.length() > 20) {
            throw new BadRequestException("Nickname must be between 2 and 20 characters.");
        }
        return normalized;
    }

    private MemberPreferredLanguage parsePreferredLanguage(String preferredLanguage) {
        if (preferredLanguage == null) {
            return null;
        }
        if (preferredLanguage.isBlank()) {
            throw new BadRequestException("Preferred language must be KO or EN.");
        }
        String normalized = preferredLanguage.trim().toUpperCase();
        try {
            return MemberPreferredLanguage.valueOf(normalized);
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Preferred language must be KO or EN.");
        }
    }
}
