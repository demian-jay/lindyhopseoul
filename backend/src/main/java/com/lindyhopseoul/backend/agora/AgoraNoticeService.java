package com.lindyhopseoul.backend.agora;

import java.util.List;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.exception.ConflictException;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import com.lindyhopseoul.backend.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AgoraNoticeService {

    private final AgoraNoticeRepository agoraNoticeRepository;

    public AgoraNoticeService(AgoraNoticeRepository agoraNoticeRepository) {
        this.agoraNoticeRepository = agoraNoticeRepository;
    }

    public List<AgoraNoticeResponse> findVisibleNotices() {
        return agoraNoticeRepository.findByVisibleTrueOrderByCreatedAtDescIdDesc()
                .stream()
                .map(AgoraNoticeResponse::from)
                .toList();
    }

    public List<AgoraNoticeResponse> findAdminNotices(AdminPrincipal actor) {
        requireAgoraNoticeManager(actor);
        return agoraNoticeRepository.findAllByOrderByCreatedAtDescIdDesc()
                .stream()
                .map(AgoraNoticeResponse::from)
                .toList();
    }

    @Transactional
    public AgoraNoticeResponse createAdminNotice(AdminPrincipal actor, AgoraNoticeRequest request) {
        requireAgoraNoticeManager(actor);
        AgoraNotice notice = AgoraNotice.create(
                cleanRequired(request.titleKo(), "Korean title is required."),
                cleanRequired(request.titleEn(), "English title is required."),
                cleanRequired(request.contentKo(), "Korean content is required."),
                cleanRequired(request.contentEn(), "English content is required."),
                request.important(),
                request.visible(),
                actor.userCd()
        );
        return AgoraNoticeResponse.from(agoraNoticeRepository.save(notice));
    }

    @Transactional
    public AgoraNoticeResponse updateAdminNotice(AdminPrincipal actor, Long id, AgoraNoticeRequest request) {
        requireAgoraNoticeManager(actor);
        AgoraNotice notice = findNotice(id);
        notice.update(
                cleanRequired(request.titleKo(), "Korean title is required."),
                cleanRequired(request.titleEn(), "English title is required."),
                cleanRequired(request.contentKo(), "Korean content is required."),
                cleanRequired(request.contentEn(), "English content is required."),
                request.important(),
                request.visible()
        );
        return AgoraNoticeResponse.from(notice);
    }

    @Transactional
    public AgoraNoticeResponse updateVisibility(
            AdminPrincipal actor,
            Long id,
            AgoraNoticeVisibilityRequest request
    ) {
        requireAgoraNoticeManager(actor);
        AgoraNotice notice = findNotice(id);
        notice.changeVisibility(request.visible());
        return AgoraNoticeResponse.from(notice);
    }

    private AgoraNotice findNotice(Long id) {
        return agoraNoticeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agora notice not found: " + id));
    }

    private void requireAgoraNoticeManager(AdminPrincipal actor) {
        if (actor == null || !actor.canManageEvents()) {
            throw new ForbiddenException("Only administrators can manage Agora notices.");
        }
    }

    private String cleanRequired(String value, String message) {
        String cleaned = value == null ? "" : value.trim();
        if (cleaned.isBlank()) {
            throw new ConflictException(message);
        }
        return cleaned;
    }
}
