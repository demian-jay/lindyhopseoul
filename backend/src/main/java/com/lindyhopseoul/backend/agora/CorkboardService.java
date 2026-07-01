package com.lindyhopseoul.backend.agora;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.OptionalInt;
import java.util.Set;
import java.util.stream.Collectors;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminRole;
import com.lindyhopseoul.backend.exception.BadRequestException;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import com.lindyhopseoul.backend.exception.ResourceNotFoundException;
import com.lindyhopseoul.backend.exception.UnauthorizedException;
import com.lindyhopseoul.backend.member.Member;
import com.lindyhopseoul.backend.member.MemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CorkboardService {

    public static final int BOARD_SLOT_CAPACITY = 18;

    private static final double MIN_POSITION_PERCENT = 0.0;
    private static final double MAX_POSITION_PERCENT = 100.0;
    private static final double MIN_ROTATION_DEG = -6.0;
    private static final double MAX_ROTATION_DEG = 6.0;
    private static final double[] FALLBACK_ROTATIONS = {-2.5, 1.7, -0.8, 2.4, -1.6, 0.9, 1.2, -2.1, 2.8};

    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter PERIOD_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final String DEFAULT_MEMBER_TEMPLATE = "yellow";
    private static final String DEFAULT_OFFICIAL_TEMPLATE = "official";
    private static final Set<String> MEMBER_TEMPLATE_KEYS = Set.of(
            "yellow",
            "pink",
            "blue",
            "white",
            "lined",
            "tape",
            "pin"
    );
    private static final Set<String> OFFICIAL_TEMPLATE_KEYS = Set.of(
            "official",
            "official-blue"
    );

    private final CorkboardRepository corkboardRepository;
    private final CorkboardNoteRepository noteRepository;
    private final MemberRepository memberRepository;

    public CorkboardService(
            CorkboardRepository corkboardRepository,
            CorkboardNoteRepository noteRepository,
            MemberRepository memberRepository
    ) {
        this.corkboardRepository = corkboardRepository;
        this.noteRepository = noteRepository;
        this.memberRepository = memberRepository;
    }

    @Transactional
    public CorkboardCollectionResponse findCurrentCorkboards() {
        return findCurrentCorkboards(null);
    }

    @Transactional
    public CorkboardCollectionResponse findCurrentCorkboards(Long currentMemberId) {
        PeriodDescriptor current = currentPeriod();
        ensureCurrentPeriod(current);
        return findPeriodCollection(current.periodKey(), false, currentMemberId);
    }

    @Transactional
    public List<CorkboardArchivePeriodResponse> findArchivePeriods() {
        archiveExpiredActiveBoards();
        LocalDate today = today();
        return toAdminPeriodSummaries(false)
                .stream()
                .filter(summary -> summary.status() == CorkboardStatus.ARCHIVED || summary.periodEnd().isBefore(today))
                .map(summary -> new CorkboardArchivePeriodResponse(
                        summary.periodKey(),
                        summary.title(),
                        summary.periodStart(),
                        summary.periodEnd(),
                        summary.status(),
                        summary.pageCount(),
                        summary.noteCount()
                ))
                .toList();
    }

    @Transactional
    public CorkboardCollectionResponse findPeriod(String periodKey) {
        return findPeriod(periodKey, null);
    }

    @Transactional
    public CorkboardCollectionResponse findPeriod(String periodKey, Long currentMemberId) {
        archiveExpiredActiveBoards();
        String normalizedPeriodKey = normalizePeriodKey(periodKey);
        PeriodDescriptor current = currentPeriod();
        if (normalizedPeriodKey.equals(current.periodKey())) {
            ensureCurrentPeriod(current);
        }
        return findPeriodCollection(normalizedPeriodKey, false, currentMemberId);
    }

    @Transactional
    public CorkboardCollectionResponse createMemberNote(Long memberId, CorkboardNoteCreateRequest request) {
        Member member = findActiveMember(memberId);
        PeriodDescriptor current = currentPeriod();
        String content = normalizeContent(request == null ? null : request.content());
        String templateKey = normalizeTemplateKey(
                request == null ? null : request.stickerTemplateKey(),
                CorkboardNoteType.MEMBER
        );
        CorkboardSlot slot = findWritableSlot(current, request == null ? null : request.pageNo());
        CorkboardNote.Placement placement = normalizePlacement(
                request == null ? null : request.positionX(),
                request == null ? null : request.positionY(),
                request == null ? null : request.rotationDeg(),
                slot.slotIndex()
        );

        noteRepository.save(CorkboardNote.createMemberNote(
                slot.board(),
                member,
                templateKey,
                content,
                slot.slotIndex(),
                placement
        ));

        return findPeriodCollection(current.periodKey(), false, member.getId());
    }

    @Transactional
    public AdminCorkboardManagementResponse findAdminCorkboards(AdminPrincipal actor, String periodKey) {
        requireCorkboardAdmin(actor);
        PeriodDescriptor current = currentPeriod();
        ensureCurrentPeriod(current);

        String selectedPeriodKey = periodKey == null || periodKey.isBlank()
                ? current.periodKey()
                : normalizePeriodKey(periodKey);
        return managementResponse(selectedPeriodKey);
    }

    @Transactional
    public List<AdminCorkboardPeriodResponse> findAdminPeriods(AdminPrincipal actor) {
        requireCorkboardAdmin(actor);
        PeriodDescriptor current = currentPeriod();
        ensureCurrentPeriod(current);
        return toAdminPeriodSummaries(true);
    }

    @Transactional
    public AdminCorkboardPeriodResponse findCurrentAdminPeriod(AdminPrincipal actor) {
        requireCorkboardAdmin(actor);
        PeriodDescriptor current = currentPeriod();
        ensureCurrentPeriod(current);
        return findAdminPeriodSummary(current.periodKey())
                .orElseThrow(() -> new ResourceNotFoundException("Current corkboard period not found."));
    }

    @Transactional
    public AdminCorkboardManagementResponse createPeriod(
            AdminPrincipal actor,
            AdminCorkboardPeriodCreateRequest request
    ) {
        requireSuperAdmin(actor);
        String periodKey = normalizePeriodKey(request == null ? null : request.periodKey());
        String title = normalizeTitle(request == null ? null : request.title());
        LocalDate periodStart = request == null ? null : request.periodStart();
        LocalDate periodEnd = request == null ? null : request.periodEnd();
        validatePeriodRange(periodStart, periodEnd);
        archiveExpiredActiveBoards();

        if (corkboardRepository.existsByPeriodKey(periodKey)) {
            throw new BadRequestException("Corkboard period already exists.");
        }
        validateNoActivePeriodOverlap(periodKey, periodStart, periodEnd);

        corkboardRepository.save(Corkboard.create(periodKey, title, periodStart, periodEnd, 1));
        return managementResponse(periodKey);
    }

    @Transactional
    public AdminCorkboardManagementResponse updatePeriod(
            AdminPrincipal actor,
            String periodKey,
            AdminCorkboardPeriodUpdateRequest request
    ) {
        requireSuperAdmin(actor);
        archiveExpiredActiveBoards();
        String normalizedPeriodKey = normalizePeriodKey(periodKey);
        String title = normalizeTitle(request == null ? null : request.title());
        LocalDate periodStart = request == null ? null : request.periodStart();
        LocalDate periodEnd = request == null ? null : request.periodEnd();
        validatePeriodRange(periodStart, periodEnd);

        List<Corkboard> boards = findBoardsByPeriodOrThrow(normalizedPeriodKey);
        if (aggregateStatus(boards) == CorkboardStatus.ARCHIVED) {
            throw new BadRequestException("Archived corkboard periods cannot be edited.");
        }
        validateNoActivePeriodOverlap(normalizedPeriodKey, periodStart, periodEnd);

        boards.forEach(board -> board.updatePeriodSettings(title, periodStart, periodEnd));
        return managementResponse(normalizedPeriodKey);
    }

    @Transactional
    public AdminCorkboardManagementResponse archivePeriod(AdminPrincipal actor, String periodKey) {
        requireSuperAdmin(actor);
        String normalizedPeriodKey = normalizePeriodKey(periodKey);
        List<Corkboard> boards = findBoardsByPeriodOrThrow(normalizedPeriodKey);
        boards.forEach(Corkboard::archive);
        return managementResponse(normalizedPeriodKey);
    }

    @Transactional
    public AdminCorkboardManagementResponse createOfficialNote(
            AdminPrincipal actor,
            AdminCorkboardNoteCreateRequest request
    ) {
        requireCorkboardAdmin(actor);
        PeriodDescriptor current = currentPeriod();
        String requestedPeriodKey = request == null ? null : request.periodKey();
        if (requestedPeriodKey != null && !requestedPeriodKey.isBlank()
                && !normalizePeriodKey(requestedPeriodKey).equals(current.periodKey())) {
            throw new BadRequestException("Only the current active corkboard is writable.");
        }

        String content = normalizeContent(request == null ? null : request.content());
        String templateKey = normalizeTemplateKey(
                request == null ? null : request.stickerTemplateKey(),
                CorkboardNoteType.OFFICIAL
        );
        CorkboardSlot slot = findWritableSlot(current, request == null ? null : request.pageNo());
        CorkboardNote.Placement placement = normalizePlacement(
                request == null ? null : request.positionX(),
                request == null ? null : request.positionY(),
                request == null ? null : request.rotationDeg(),
                slot.slotIndex()
        );
        noteRepository.save(CorkboardNote.createOfficialNote(
                slot.board(),
                adminDisplayName(actor),
                templateKey,
                content,
                slot.slotIndex(),
                placement
        ));

        return managementResponse(current.periodKey());
    }

    @Transactional
    public CorkboardNoteResponse updateHidden(AdminPrincipal actor, Long noteId, CorkboardNoteHiddenRequest request) {
        requireCorkboardAdmin(actor);
        CorkboardNote note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Corkboard note not found."));
        if (note.isDeleted()) {
            throw new BadRequestException("Deleted corkboard notes cannot be moderated.");
        }
        note.setHidden(request != null && request.hidden());
        return CorkboardNoteResponse.from(note);
    }

    @Transactional
    public CorkboardNoteResponse updateMemberNotePosition(
            Long memberId,
            Long noteId,
            CorkboardNotePositionRequest request
    ) {
        Member member = findActiveMember(memberId);
        CorkboardNote note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Corkboard note not found."));
        if (note.isDeleted()) {
            throw new BadRequestException("Deleted corkboard notes cannot be moved.");
        }
        if (note.isHidden()) {
            throw new ForbiddenException("Hidden corkboard notes cannot be moved by members.");
        }
        if (!canMemberEditPosition(note, member.getId(), true)) {
            throw new ForbiddenException("Only your own member notes can be moved.");
        }
        if (!isWritableNoteBoard(note)) {
            throw new BadRequestException("Only the current writable corkboard can be edited.");
        }

        CorkboardNote.Placement placement = normalizeFreePlacement(request, note.getSlotIndex());
        note.updatePlacement(placement);
        return CorkboardNoteResponse.from(note, true);
    }

    @Transactional
    public CorkboardNoteResponse updateAdminNotePosition(
            AdminPrincipal actor,
            Long noteId,
            CorkboardNotePositionRequest request
    ) {
        requireCorkboardAdmin(actor);
        CorkboardNote note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Corkboard note not found."));
        if (note.isDeleted()) {
            throw new BadRequestException("Deleted corkboard notes cannot be moved.");
        }
        if (!isWritableNoteBoard(note)) {
            throw new BadRequestException("Only the current writable corkboard can be edited.");
        }

        CorkboardNote.Placement placement = normalizeFreePlacement(request, note.getSlotIndex());
        note.updatePlacement(placement);
        return CorkboardNoteResponse.from(note);
    }

    @Transactional
    public CorkboardNoteResponse updateMemberNoteContent(
            Long memberId,
            Long noteId,
            CorkboardNoteContentRequest request
    ) {
        Member member = findActiveMember(memberId);
        CorkboardNote note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Corkboard note not found."));
        validateMemberOwnedVisibleWritableNote(note, member.getId(), "edited");

        note.updateContent(normalizeContent(request == null ? null : request.content()));
        return CorkboardNoteResponse.from(note, true);
    }

    @Transactional
    public void deleteMemberNote(Long memberId, Long noteId) {
        Member member = findActiveMember(memberId);
        CorkboardNote note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Corkboard note not found."));
        validateMemberOwnedVisibleWritableNote(note, member.getId(), "deleted");

        note.softDelete(member.getId());
    }

    @Transactional
    public CorkboardNoteResponse updateAdminOfficialNoteContent(
            AdminPrincipal actor,
            Long noteId,
            CorkboardNoteContentRequest request
    ) {
        requireCorkboardAdmin(actor);
        CorkboardNote note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Corkboard note not found."));
        if (note.isDeleted()) {
            throw new BadRequestException("Deleted corkboard notes cannot be edited.");
        }
        if (note.getNoteType() != CorkboardNoteType.OFFICIAL) {
            throw new ForbiddenException("Member corkboard notes should be moderated with hidden status.");
        }
        if (!isWritableNoteBoard(note)) {
            throw new BadRequestException("Only the current writable corkboard can be edited.");
        }

        note.updateContent(normalizeContent(request == null ? null : request.content()));
        return CorkboardNoteResponse.from(note);
    }

    private AdminCorkboardManagementResponse managementResponse(String selectedPeriodKey) {
        PeriodDescriptor current = currentPeriod();
        ensureCurrentPeriod(current);
        return new AdminCorkboardManagementResponse(
                toAdminPeriodSummaries(true),
                findPeriodCollection(selectedPeriodKey, true),
                findAdminPeriodSummary(current.periodKey()).orElse(null)
        );
    }

    private CorkboardSlot findWritableSlot(PeriodDescriptor current, Integer preferredPageNo) {
        ensureCurrentPeriod(current);
        List<Corkboard> boards = corkboardRepository.findByPeriodKeyOrderByPageNoAsc(current.periodKey());
        if (!isWritablePeriod(boards)) {
            throw new BadRequestException("Current corkboard is read-only.");
        }

        if (preferredPageNo != null) {
            for (Corkboard board : boards) {
                if (board.getStatus() != CorkboardStatus.ACTIVE || board.getPageNo() != preferredPageNo) {
                    continue;
                }
                OptionalInt slotIndex = findFreeSlot(board);
                if (slotIndex.isPresent()) {
                    return new CorkboardSlot(board, slotIndex.getAsInt());
                }
            }
        }

        for (Corkboard board : boards) {
            if (board.getStatus() != CorkboardStatus.ACTIVE) {
                continue;
            }
            OptionalInt slotIndex = findFreeSlot(board);
            if (slotIndex.isPresent()) {
                return new CorkboardSlot(board, slotIndex.getAsInt());
            }
        }

        Corkboard firstBoard = boards.get(0);
        int nextPageNo = corkboardRepository.findTopByPeriodKeyOrderByPageNoDesc(current.periodKey())
                .map(lastBoard -> lastBoard.getPageNo() + 1)
                .orElse(1);
        Corkboard board = corkboardRepository.save(Corkboard.create(
                firstBoard.getPeriodKey(),
                firstBoard.getTitle(),
                firstBoard.getPeriodStart(),
                firstBoard.getPeriodEnd(),
                nextPageNo
        ));
        return new CorkboardSlot(board, 0);
    }

    private OptionalInt findFreeSlot(Corkboard board) {
        boolean[] occupiedSlots = new boolean[BOARD_SLOT_CAPACITY];
        for (CorkboardNote note : noteRepository.findByBoardOrderBySlotIndexAscIdAsc(board)) {
            int slotIndex = note.getSlotIndex();
            if (slotIndex >= 0 && slotIndex < BOARD_SLOT_CAPACITY) {
                occupiedSlots[slotIndex] = true;
            }
        }

        for (int index = 0; index < occupiedSlots.length; index++) {
            if (!occupiedSlots[index]) {
                return OptionalInt.of(index);
            }
        }
        return OptionalInt.empty();
    }

    private void ensureCurrentPeriod(PeriodDescriptor current) {
        archiveExpiredActiveBoards();
        if (!corkboardRepository.findByPeriodKeyOrderByPageNoAsc(current.periodKey()).isEmpty()) {
            return;
        }
        corkboardRepository.save(Corkboard.create(
                current.periodKey(),
                current.title(),
                current.periodStart(),
                current.periodEnd(),
                1
        ));
    }

    private void archiveExpiredActiveBoards() {
        LocalDate today = today();
        for (Corkboard board : corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)) {
            if (board.getPeriodEnd().isBefore(today)) {
                board.archive();
            }
        }
    }

    private CorkboardNote.Placement normalizePlacement(
            Double positionX,
            Double positionY,
            Double rotationDeg,
            int slotIndex
    ) {
        if (positionX == null && positionY == null && rotationDeg == null) {
            return new CorkboardNote.Placement(
                    null,
                    null,
                    defaultRotation(slotIndex),
                    slotIndex + 1,
                    CorkboardNotePlacementMode.SLOT
            );
        }

        if (positionX == null || positionY == null) {
            throw new BadRequestException("Corkboard note positionX and positionY are required together.");
        }

        double normalizedX = normalizePosition(positionX, "positionX");
        double normalizedY = normalizePosition(positionY, "positionY");
        double normalizedRotation = normalizeRotation(rotationDeg == null ? defaultRotation(slotIndex) : rotationDeg);
        return new CorkboardNote.Placement(
                normalizedX,
                normalizedY,
                normalizedRotation,
                slotIndex + 1,
                CorkboardNotePlacementMode.FREE
        );
    }

    private CorkboardNote.Placement normalizeFreePlacement(CorkboardNotePositionRequest request, int slotIndex) {
        if (request == null || request.positionX() == null || request.positionY() == null) {
            throw new BadRequestException("Corkboard note positionX and positionY are required.");
        }
        return normalizePlacement(request.positionX(), request.positionY(), request.rotationDeg(), slotIndex);
    }

    private double normalizePosition(Double value, String fieldName) {
        if (value == null || !Double.isFinite(value)) {
            throw new BadRequestException("Corkboard note " + fieldName + " is invalid.");
        }
        if (value < MIN_POSITION_PERCENT || value > MAX_POSITION_PERCENT) {
            throw new BadRequestException("Corkboard note " + fieldName + " must be between 0 and 100.");
        }
        return Math.round(value * 10.0) / 10.0;
    }

    private double normalizeRotation(Double value) {
        if (value == null || !Double.isFinite(value)) {
            throw new BadRequestException("Corkboard note rotationDeg is invalid.");
        }
        if (value < MIN_ROTATION_DEG || value > MAX_ROTATION_DEG) {
            throw new BadRequestException("Corkboard note rotationDeg must be between -6 and 6.");
        }
        return Math.round(value * 10.0) / 10.0;
    }

    private double defaultRotation(int slotIndex) {
        return FALLBACK_ROTATIONS[Math.floorMod(slotIndex, FALLBACK_ROTATIONS.length)];
    }

    private CorkboardCollectionResponse findPeriodCollection(String periodKey, boolean includeHidden) {
        return findPeriodCollection(periodKey, includeHidden, null);
    }

    private CorkboardCollectionResponse findPeriodCollection(String periodKey, boolean includeHidden, Long currentMemberId) {
        List<Corkboard> boards = corkboardRepository.findByPeriodKeyOrderByPageNoAsc(periodKey);
        if (boards.isEmpty()) {
            throw new ResourceNotFoundException("Corkboard period not found: " + periodKey);
        }

        CorkboardStatus status = aggregateStatus(boards);
        boolean readOnly = !isWritablePeriod(boards);
        boolean periodWritable = !readOnly;
        Map<Long, List<CorkboardNoteResponse>> notesByBoardId = noteRepository.findByBoardInOrderByBoard_PageNoAscSlotIndexAscIdAsc(boards)
                .stream()
                .filter(note -> !note.isDeleted())
                .filter(note -> includeHidden || !note.isHidden())
                .map(note -> CorkboardNoteResponse.from(
                        note,
                        canMemberEditPosition(note, currentMemberId, periodWritable)
                ))
                .collect(Collectors.groupingBy(
                        CorkboardNoteResponse::boardId,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        List<CorkboardPageResponse> pages = boards.stream()
                .map(board -> CorkboardPageResponse.from(
                        board,
                        notesByBoardId.getOrDefault(board.getId(), List.of()),
                        readOnly
                ))
                .toList();
        Corkboard firstBoard = boards.get(0);
        return new CorkboardCollectionResponse(
                firstBoard.getPeriodKey(),
                firstBoard.getTitle(),
                firstBoard.getPeriodStart(),
                firstBoard.getPeriodEnd(),
                status,
                readOnly,
                pages
        );
    }

    private List<AdminCorkboardPeriodResponse> toAdminPeriodSummaries(boolean includeHidden) {
        List<Corkboard> boards = corkboardRepository.findAllByOrderByPeriodStartDescPageNoAsc();
        if (boards.isEmpty()) {
            return List.of();
        }

        Map<String, List<Corkboard>> boardsByPeriod = boards.stream()
                .collect(Collectors.groupingBy(
                        Corkboard::getPeriodKey,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
        Map<String, Long> noteCountsByPeriod = noteRepository.findByBoardInOrderByBoard_PageNoAscSlotIndexAscIdAsc(boards)
                .stream()
                .filter(note -> !note.isDeleted())
                .filter(note -> includeHidden || !note.isHidden())
                .collect(Collectors.groupingBy(
                        note -> note.getBoard().getPeriodKey(),
                        Collectors.counting()
                ));

        List<AdminCorkboardPeriodResponse> summaries = new ArrayList<>();
        for (Map.Entry<String, List<Corkboard>> entry : boardsByPeriod.entrySet()) {
            List<Corkboard> periodBoards = entry.getValue();
            Corkboard firstBoard = periodBoards.get(0);
            summaries.add(new AdminCorkboardPeriodResponse(
                    firstBoard.getPeriodKey(),
                    firstBoard.getTitle(),
                    firstBoard.getPeriodStart(),
                    firstBoard.getPeriodEnd(),
                    aggregateStatus(periodBoards),
                    periodBoards.size(),
                    noteCountsByPeriod.getOrDefault(firstBoard.getPeriodKey(), 0L),
                    isWritablePeriod(periodBoards)
            ));
        }
        return summaries;
    }

    private java.util.Optional<AdminCorkboardPeriodResponse> findAdminPeriodSummary(String periodKey) {
        return toAdminPeriodSummaries(true)
                .stream()
                .filter(summary -> summary.periodKey().equals(periodKey))
                .findFirst();
    }

    private List<Corkboard> findBoardsByPeriodOrThrow(String periodKey) {
        List<Corkboard> boards = corkboardRepository.findByPeriodKeyOrderByPageNoAsc(periodKey);
        if (boards.isEmpty()) {
            throw new ResourceNotFoundException("Corkboard period not found: " + periodKey);
        }
        return boards;
    }

    private CorkboardStatus aggregateStatus(List<Corkboard> boards) {
        return boards.stream().anyMatch(board -> board.getStatus() == CorkboardStatus.ACTIVE)
                ? CorkboardStatus.ACTIVE
                : CorkboardStatus.ARCHIVED;
    }

    private boolean isWritablePeriod(List<Corkboard> boards) {
        if (boards == null || boards.isEmpty() || aggregateStatus(boards) != CorkboardStatus.ACTIVE) {
            return false;
        }
        Corkboard firstBoard = boards.get(0);
        LocalDate today = today();
        return !firstBoard.getPeriodStart().isAfter(today) && !firstBoard.getPeriodEnd().isBefore(today);
    }

    private boolean isWritableNoteBoard(CorkboardNote note) {
        archiveExpiredActiveBoards();
        Corkboard board = note.getBoard();
        if (board == null) {
            return false;
        }
        return isWritablePeriod(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(board.getPeriodKey()));
    }

    private boolean canMemberEditPosition(CorkboardNote note, Long memberId, boolean periodWritable) {
        if (memberId == null || !periodWritable || note == null || note.isHidden() || note.isDeleted()) {
            return false;
        }
        if (note.getNoteType() != CorkboardNoteType.MEMBER || note.getMember() == null) {
            return false;
        }
        Long noteMemberId = note.getMember().getId();
        return noteMemberId != null && noteMemberId.equals(memberId);
    }

    private void validateMemberOwnedVisibleWritableNote(CorkboardNote note, Long memberId, String action) {
        if (note.isDeleted()) {
            throw new BadRequestException("Deleted corkboard notes cannot be " + action + ".");
        }
        if (note.isHidden()) {
            throw new ForbiddenException("Hidden corkboard notes cannot be " + action + " by members.");
        }
        if (note.getNoteType() != CorkboardNoteType.MEMBER || note.getMember() == null) {
            throw new ForbiddenException("Only your own member notes can be " + action + ".");
        }
        Long noteMemberId = note.getMember().getId();
        if (noteMemberId == null || !noteMemberId.equals(memberId)) {
            throw new ForbiddenException("Only your own member notes can be " + action + ".");
        }
        if (!isWritableNoteBoard(note)) {
            throw new BadRequestException("Only the current writable corkboard can be edited.");
        }
    }

    private boolean rangesOverlap(LocalDate leftStart, LocalDate leftEnd, LocalDate rightStart, LocalDate rightEnd) {
        return !leftEnd.isBefore(rightStart) && !rightEnd.isBefore(leftStart);
    }

    private void validateNoActivePeriodOverlap(String periodKey, LocalDate periodStart, LocalDate periodEnd) {
        Map<String, List<Corkboard>> activeBoardsByPeriod = corkboardRepository.findAllByOrderByPeriodStartDescPageNoAsc()
                .stream()
                .filter(board -> board.getStatus() == CorkboardStatus.ACTIVE)
                .filter(board -> !board.getPeriodKey().equals(periodKey))
                .collect(Collectors.groupingBy(
                        Corkboard::getPeriodKey,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        for (List<Corkboard> boards : activeBoardsByPeriod.values()) {
            Corkboard firstBoard = boards.get(0);
            if (rangesOverlap(periodStart, periodEnd, firstBoard.getPeriodStart(), firstBoard.getPeriodEnd())) {
                throw new BadRequestException("Corkboard period overlaps an active period.");
            }
        }
    }

    private Member findActiveMember(Long memberId) {
        if (memberId == null) {
            throw new UnauthorizedException("Login is required.");
        }
        return memberRepository.findById(memberId)
                .filter(Member::isActive)
                .orElseThrow(() -> new UnauthorizedException("Login is required."));
    }

    private void requireCorkboardAdmin(AdminPrincipal actor) {
        if (actor == null || !actor.canManageEvents()) {
            throw new ForbiddenException("Only administrators can manage corkboards.");
        }
    }

    private void requireSuperAdmin(AdminPrincipal actor) {
        if (actor == null || !actor.hasRole(AdminRole.SUPER_ADMIN)) {
            throw new ForbiddenException("Only super administrators can manage corkboard periods.");
        }
    }

    private String normalizeContent(String content) {
        if (content == null) {
            throw new BadRequestException("Corkboard note content is required.");
        }

        String normalized = content.strip();
        if (normalized.isBlank()) {
            throw new BadRequestException("Corkboard note content is required.");
        }
        if (normalized.length() > 200) {
            throw new BadRequestException("Corkboard note content must be 200 characters or fewer.");
        }
        return normalized;
    }

    private String normalizeTemplateKey(String templateKey, CorkboardNoteType noteType) {
        String fallback = noteType == CorkboardNoteType.OFFICIAL ? DEFAULT_OFFICIAL_TEMPLATE : DEFAULT_MEMBER_TEMPLATE;
        String normalized = templateKey == null || templateKey.isBlank() ? fallback : templateKey.strip();
        Set<String> allowedKeys = noteType == CorkboardNoteType.OFFICIAL
                ? union(OFFICIAL_TEMPLATE_KEYS, MEMBER_TEMPLATE_KEYS)
                : MEMBER_TEMPLATE_KEYS;
        if (!allowedKeys.contains(normalized)) {
            throw new BadRequestException("Unsupported corkboard note template.");
        }
        return normalized;
    }

    private String normalizePeriodKey(String periodKey) {
        if (periodKey == null || periodKey.isBlank()) {
            throw new BadRequestException("Corkboard periodKey is required.");
        }
        String normalized = periodKey.strip();
        if (!normalized.matches("\\d{4}-\\d{2}")) {
            throw new BadRequestException("Corkboard periodKey must use YYYY-MM format.");
        }
        return normalized;
    }

    private String normalizeTitle(String title) {
        if (title == null) {
            throw new BadRequestException("Corkboard title is required.");
        }
        String normalized = title.strip();
        if (normalized.isBlank()) {
            throw new BadRequestException("Corkboard title is required.");
        }
        if (normalized.length() > 120) {
            throw new BadRequestException("Corkboard title must be 120 characters or fewer.");
        }
        return normalized;
    }

    private void validatePeriodRange(LocalDate periodStart, LocalDate periodEnd) {
        if (periodStart == null || periodEnd == null) {
            throw new BadRequestException("Corkboard periodStart and periodEnd are required.");
        }
        if (!periodStart.isBefore(periodEnd)) {
            throw new BadRequestException("Corkboard periodStart must be before periodEnd.");
        }
    }

    private String adminDisplayName(AdminPrincipal actor) {
        if (actor == null || actor.userNm() == null || actor.userNm().isBlank()) {
            return "SwingPop";
        }
        String displayName = actor.userNm().strip();
        if (displayName.contains("@")) {
            return "SwingPop";
        }
        return displayName;
    }

    private PeriodDescriptor currentPeriod() {
        archiveExpiredActiveBoards();
        LocalDate today = today();
        return corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)
                .stream()
                .filter(board -> !board.getPeriodStart().isAfter(today) && !board.getPeriodEnd().isBefore(today))
                .sorted(Comparator
                        .comparing(Corkboard::getPeriodStart)
                        .thenComparing(Corkboard::getPeriodKey)
                        .thenComparingInt(Corkboard::getPageNo))
                .findFirst()
                .map(board -> new PeriodDescriptor(
                        board.getPeriodKey(),
                        board.getTitle(),
                        board.getPeriodStart(),
                        board.getPeriodEnd()
                ))
                .orElseGet(this::defaultMonthlyPeriod);
    }

    private PeriodDescriptor defaultMonthlyPeriod() {
        YearMonth month = YearMonth.from(today());
        String periodKey = month.format(PERIOD_FORMATTER);
        return new PeriodDescriptor(
                periodKey,
                "Agora Corkboard " + periodKey,
                month.atDay(1),
                month.atEndOfMonth()
        );
    }

    private LocalDate today() {
        return LocalDate.now(SEOUL_ZONE);
    }

    private Set<String> union(Set<String> left, Set<String> right) {
        return java.util.stream.Stream.of(left, right)
                .flatMap(Collection::stream)
                .collect(Collectors.toSet());
    }

    private record PeriodDescriptor(
            String periodKey,
            String title,
            LocalDate periodStart,
            LocalDate periodEnd
    ) {
    }

    private record CorkboardSlot(
            Corkboard board,
            int slotIndex
    ) {
    }
}
