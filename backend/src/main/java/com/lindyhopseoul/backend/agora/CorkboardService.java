package com.lindyhopseoul.backend.agora;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.OptionalInt;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
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
        PeriodDescriptor current = currentPeriod();
        ensureCurrentPeriod(current);
        return findPeriodCollection(current.periodKey(), false);
    }

    @Transactional
    public List<CorkboardArchivePeriodResponse> findArchivePeriods() {
        PeriodDescriptor current = currentPeriod();
        archiveExpiredActiveBoards(current);
        return toPeriodSummaries(false)
                .stream()
                .filter(summary -> !summary.periodKey().equals(current.periodKey()))
                .toList();
    }

    @Transactional
    public CorkboardCollectionResponse findPeriod(String periodKey) {
        PeriodDescriptor current = currentPeriod();
        String normalizedPeriodKey = normalizePeriodKey(periodKey);
        if (normalizedPeriodKey.equals(current.periodKey())) {
            ensureCurrentPeriod(current);
        } else {
            archiveExpiredActiveBoards(current);
        }
        return findPeriodCollection(normalizedPeriodKey, false);
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
        CorkboardSlot slot = findWritableSlot(current);

        noteRepository.save(CorkboardNote.createMemberNote(
                slot.board(),
                member,
                templateKey,
                content,
                slot.slotIndex()
        ));

        return findPeriodCollection(current.periodKey(), false);
    }

    @Transactional
    public AdminCorkboardManagementResponse findAdminCorkboards(AdminPrincipal actor, String periodKey) {
        requireCorkboardAdmin(actor);
        PeriodDescriptor current = currentPeriod();
        ensureCurrentPeriod(current);

        String selectedPeriodKey = periodKey == null || periodKey.isBlank()
                ? current.periodKey()
                : normalizePeriodKey(periodKey);
        CorkboardCollectionResponse selected = findPeriodCollection(selectedPeriodKey, true);
        return new AdminCorkboardManagementResponse(toPeriodSummaries(true), selected);
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
            throw new BadRequestException("Past corkboards are read-only.");
        }

        String content = normalizeContent(request == null ? null : request.content());
        String templateKey = normalizeTemplateKey(
                request == null ? null : request.stickerTemplateKey(),
                CorkboardNoteType.OFFICIAL
        );
        CorkboardSlot slot = findWritableSlot(current);
        noteRepository.save(CorkboardNote.createOfficialNote(
                slot.board(),
                adminDisplayName(actor),
                templateKey,
                content,
                slot.slotIndex()
        ));

        return new AdminCorkboardManagementResponse(toPeriodSummaries(true), findPeriodCollection(current.periodKey(), true));
    }

    @Transactional
    public CorkboardNoteResponse updateHidden(AdminPrincipal actor, Long noteId, CorkboardNoteHiddenRequest request) {
        requireCorkboardAdmin(actor);
        CorkboardNote note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Corkboard note not found."));
        note.setHidden(request != null && request.hidden());
        return CorkboardNoteResponse.from(note);
    }

    private CorkboardSlot findWritableSlot(PeriodDescriptor current) {
        ensureCurrentPeriod(current);
        List<Corkboard> boards = corkboardRepository.findByPeriodKeyOrderByPageNoAsc(current.periodKey());
        for (Corkboard board : boards) {
            if (board.getStatus() != CorkboardStatus.ACTIVE) {
                continue;
            }
            OptionalInt slotIndex = findFreeSlot(board);
            if (slotIndex.isPresent()) {
                return new CorkboardSlot(board, slotIndex.getAsInt());
            }
        }

        int nextPageNo = corkboardRepository.findTopByPeriodKeyOrderByPageNoDesc(current.periodKey())
                .map(lastBoard -> lastBoard.getPageNo() + 1)
                .orElse(1);
        Corkboard board = corkboardRepository.save(Corkboard.create(
                current.periodKey(),
                current.title(),
                current.periodStart(),
                current.periodEnd(),
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
        archiveExpiredActiveBoards(current);
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

    private void archiveExpiredActiveBoards(PeriodDescriptor current) {
        LocalDate today = LocalDate.now(SEOUL_ZONE);
        for (Corkboard board : corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)) {
            if (!board.getPeriodKey().equals(current.periodKey()) || board.getPeriodEnd().isBefore(today)) {
                board.archive();
            }
        }
    }

    private CorkboardCollectionResponse findPeriodCollection(String periodKey, boolean includeHidden) {
        List<Corkboard> boards = corkboardRepository.findByPeriodKeyOrderByPageNoAsc(periodKey);
        if (boards.isEmpty()) {
            throw new ResourceNotFoundException("Corkboard period not found: " + periodKey);
        }

        Map<Long, List<CorkboardNoteResponse>> notesByBoardId = noteRepository.findByBoardInOrderByBoard_PageNoAscSlotIndexAscIdAsc(boards)
                .stream()
                .filter(note -> includeHidden || !note.isHidden())
                .map(CorkboardNoteResponse::from)
                .collect(Collectors.groupingBy(
                        CorkboardNoteResponse::boardId,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        CorkboardStatus status = boards.stream().anyMatch(board -> board.getStatus() == CorkboardStatus.ACTIVE)
                ? CorkboardStatus.ACTIVE
                : CorkboardStatus.ARCHIVED;
        boolean readOnly = status != CorkboardStatus.ACTIVE || !periodKey.equals(currentPeriod().periodKey());
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

    private List<CorkboardArchivePeriodResponse> toPeriodSummaries(boolean includeHidden) {
        List<Corkboard> boards = corkboardRepository.findAllByOrderByPeriodStartDescPageNoAsc();
        if (boards.isEmpty()) {
            return List.of();
        }

        Map<Long, Corkboard> boardsById = boards.stream()
                .collect(Collectors.toMap(Corkboard::getId, Function.identity()));
        Map<String, List<Corkboard>> boardsByPeriod = boards.stream()
                .collect(Collectors.groupingBy(
                        Corkboard::getPeriodKey,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
        Map<String, Long> noteCountsByPeriod = noteRepository.findByBoardInOrderByBoard_PageNoAscSlotIndexAscIdAsc(boards)
                .stream()
                .filter(note -> includeHidden || !note.isHidden())
                .collect(Collectors.groupingBy(
                        note -> boardsById.get(note.getBoard().getId()).getPeriodKey(),
                        Collectors.counting()
                ));

        List<CorkboardArchivePeriodResponse> summaries = new ArrayList<>();
        for (Map.Entry<String, List<Corkboard>> entry : boardsByPeriod.entrySet()) {
            List<Corkboard> periodBoards = entry.getValue();
            Corkboard firstBoard = periodBoards.get(0);
            CorkboardStatus status = periodBoards.stream().anyMatch(board -> board.getStatus() == CorkboardStatus.ACTIVE)
                    ? CorkboardStatus.ACTIVE
                    : CorkboardStatus.ARCHIVED;
            summaries.add(new CorkboardArchivePeriodResponse(
                    firstBoard.getPeriodKey(),
                    firstBoard.getTitle(),
                    firstBoard.getPeriodStart(),
                    firstBoard.getPeriodEnd(),
                    status,
                    periodBoards.size(),
                    noteCountsByPeriod.getOrDefault(firstBoard.getPeriodKey(), 0L)
            ));
        }
        return summaries;
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
        YearMonth month = YearMonth.from(LocalDate.now(SEOUL_ZONE));
        String periodKey = month.format(PERIOD_FORMATTER);
        return new PeriodDescriptor(
                periodKey,
                "Agora Corkboard " + periodKey,
                month.atDay(1),
                month.atEndOfMonth()
        );
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
