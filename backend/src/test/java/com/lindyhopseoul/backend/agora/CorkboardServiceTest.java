package com.lindyhopseoul.backend.agora;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

import com.lindyhopseoul.backend.admin.AdminLanguage;
import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminRole;
import com.lindyhopseoul.backend.exception.BadRequestException;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import com.lindyhopseoul.backend.member.Member;
import com.lindyhopseoul.backend.member.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

class CorkboardServiceTest {

    private CorkboardRepository corkboardRepository;
    private CorkboardNoteRepository noteRepository;
    private MemberRepository memberRepository;
    private CorkboardService corkboardService;
    private Member member;
    private Corkboard currentBoard;

    @BeforeEach
    void setUp() {
        corkboardRepository = mock(CorkboardRepository.class);
        noteRepository = mock(CorkboardNoteRepository.class);
        memberRepository = mock(MemberRepository.class);
        corkboardService = new CorkboardService(corkboardRepository, noteRepository, memberRepository);

        member = Member.createGoogle(
                "google-sub-1",
                "dancer@example.com",
                "Dancer One",
                Instant.parse("2026-06-23T00:00:00Z")
        );
        member.updateSettings("Sunny", null);
        ReflectionTestUtils.setField(member, "id", 1L);
        currentBoard = currentBoard(1L, 1);
    }

    @Test
    void createMemberNoteTrimsContentAndAssignsFirstFreeSlot() {
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of());
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(currentBoard.getPeriodKey()))
                .thenReturn(List.of(currentBoard), List.of(currentBoard), List.of(currentBoard));
        when(noteRepository.findByBoardOrderBySlotIndexAscIdAsc(currentBoard)).thenReturn(List.of());
        when(noteRepository.findByBoardInOrderByBoard_PageNoAscSlotIndexAscIdAsc(List.of(currentBoard)))
                .thenReturn(List.of());

        corkboardService.createMemberNote(1L, new CorkboardNoteCreateRequest("pink", "  hello corkboard  "));

        ArgumentCaptor<CorkboardNote> noteCaptor = ArgumentCaptor.forClass(CorkboardNote.class);
        verify(noteRepository).save(noteCaptor.capture());
        CorkboardNote savedNote = noteCaptor.getValue();

        assertThat(savedNote.getNoteType()).isEqualTo(CorkboardNoteType.MEMBER);
        assertThat(savedNote.getMember()).isEqualTo(member);
        assertThat(savedNote.getStickerTemplateKey()).isEqualTo("pink");
        assertThat(savedNote.getContent()).isEqualTo("hello corkboard");
        assertThat(savedNote.getSlotIndex()).isZero();
        assertThat(savedNote.getPositionX()).isNull();
        assertThat(savedNote.getPositionY()).isNull();
        assertThat(savedNote.getPlacementMode()).isEqualTo(CorkboardNotePlacementMode.SLOT);
        assertThat(savedNote.getAuthorNicknameSnapshot()).isEqualTo("Sunny");
    }

    @Test
    void createMemberNoteStoresFreePlacement() {
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of());
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(currentBoard.getPeriodKey()))
                .thenReturn(List.of(currentBoard), List.of(currentBoard), List.of(currentBoard));
        when(noteRepository.findByBoardOrderBySlotIndexAscIdAsc(currentBoard)).thenReturn(List.of());
        when(noteRepository.findByBoardInOrderByBoard_PageNoAscSlotIndexAscIdAsc(List.of(currentBoard)))
                .thenReturn(List.of());

        corkboardService.createMemberNote(
                1L,
                new CorkboardNoteCreateRequest("blue", "  placed note  ", 25.44, 38.74, 4.24, 1)
        );

        ArgumentCaptor<CorkboardNote> noteCaptor = ArgumentCaptor.forClass(CorkboardNote.class);
        verify(noteRepository).save(noteCaptor.capture());
        CorkboardNote savedNote = noteCaptor.getValue();

        assertThat(savedNote.getContent()).isEqualTo("placed note");
        assertThat(savedNote.getPositionX()).isEqualTo(25.4);
        assertThat(savedNote.getPositionY()).isEqualTo(38.7);
        assertThat(savedNote.getRotationDeg()).isEqualTo(4.2);
        assertThat(savedNote.getZIndex()).isEqualTo(1);
        assertThat(savedNote.getPlacementMode()).isEqualTo(CorkboardNotePlacementMode.FREE);
    }

    @Test
    void createMemberNoteRejectsOutOfRangePlacementValues() {
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of());
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(currentBoard.getPeriodKey()))
                .thenReturn(List.of(currentBoard));
        when(noteRepository.findByBoardOrderBySlotIndexAscIdAsc(currentBoard)).thenReturn(List.of());

        assertThatThrownBy(() -> corkboardService.createMemberNote(
                1L,
                new CorkboardNoteCreateRequest("yellow", "bad x", -0.1, 50.0, 0.0, 1)
        )).isInstanceOf(BadRequestException.class);

        assertThatThrownBy(() -> corkboardService.createMemberNote(
                1L,
                new CorkboardNoteCreateRequest("yellow", "bad y", 50.0, 100.1, 0.0, 1)
        )).isInstanceOf(BadRequestException.class);

        assertThatThrownBy(() -> corkboardService.createMemberNote(
                1L,
                new CorkboardNoteCreateRequest("yellow", "bad rotation", 50.0, 50.0, 6.1, 1)
        )).isInstanceOf(BadRequestException.class);
    }

    @Test
    void noteResponseTreatsLegacySlotNoteAsSlotPlacement() {
        CorkboardNote note = CorkboardNote.createMemberNote(currentBoard, member, "yellow", "legacy note", 3);

        CorkboardNoteResponse response = CorkboardNoteResponse.from(note);

        assertThat(response.slotIndex()).isEqualTo(3);
        assertThat(response.positionX()).isNull();
        assertThat(response.positionY()).isNull();
        assertThat(response.placementMode()).isEqualTo(CorkboardNotePlacementMode.SLOT);
    }

    @Test
    void createMemberNoteCreatesNextBoardPageWhenCurrentPageIsFull() {
        Corkboard nextBoard = currentBoard(2L, 2);
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of());
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(currentBoard.getPeriodKey()))
                .thenReturn(List.of(currentBoard), List.of(currentBoard), List.of(currentBoard, nextBoard));
        when(corkboardRepository.findTopByPeriodKeyOrderByPageNoDesc(currentBoard.getPeriodKey()))
                .thenReturn(Optional.of(currentBoard));
        when(corkboardRepository.save(any(Corkboard.class))).thenReturn(nextBoard);
        when(noteRepository.findByBoardOrderBySlotIndexAscIdAsc(currentBoard)).thenReturn(fullPageNotes(currentBoard));
        when(noteRepository.findByBoardInOrderByBoard_PageNoAscSlotIndexAscIdAsc(List.of(currentBoard, nextBoard)))
                .thenReturn(List.of());

        corkboardService.createMemberNote(1L, new CorkboardNoteCreateRequest("yellow", "new page please"));

        ArgumentCaptor<CorkboardNote> noteCaptor = ArgumentCaptor.forClass(CorkboardNote.class);
        verify(noteRepository).save(noteCaptor.capture());

        assertThat(noteCaptor.getValue().getBoard()).isEqualTo(nextBoard);
        assertThat(noteCaptor.getValue().getSlotIndex()).isZero();
    }

    @Test
    void createMemberNoteRejectsBlankAndTooLongContent() {
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of());
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(currentBoard.getPeriodKey()))
                .thenReturn(List.of(currentBoard), List.of(currentBoard));
        when(noteRepository.findByBoardOrderBySlotIndexAscIdAsc(currentBoard)).thenReturn(List.of());

        assertThatThrownBy(() -> corkboardService.createMemberNote(
                1L,
                new CorkboardNoteCreateRequest("yellow", "   ")
        )).isInstanceOf(BadRequestException.class);

        assertThatThrownBy(() -> corkboardService.createMemberNote(
                1L,
                new CorkboardNoteCreateRequest("yellow", "a".repeat(201))
        )).isInstanceOf(BadRequestException.class);
    }

    @Test
    void createOfficialNoteRejectsPastPeriod() {
        assertThatThrownBy(() -> corkboardService.createOfficialNote(
                staffPrincipal(),
                new AdminCorkboardNoteCreateRequest("1999-01", "official", "past note")
        )).isInstanceOf(BadRequestException.class);
    }

    @Test
    void adminActionsRejectMemberRole() {
        AdminPrincipal memberPrincipal = new AdminPrincipal(
                "member-1",
                "Member",
                "member",
                AdminRole.MEMBER,
                List.of(AdminRole.MEMBER),
                AdminLanguage.Kor
        );

        assertThatThrownBy(() -> corkboardService.findAdminCorkboards(memberPrincipal, null))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void createPeriodRequiresSuperAdmin() {
        assertThatThrownBy(() -> corkboardService.createPeriod(
                staffPrincipal(),
                new AdminCorkboardPeriodCreateRequest(
                        "2030-01",
                        "January Board",
                        LocalDate.of(2030, 1, 1),
                        LocalDate.of(2030, 1, 31)
                )
        )).isInstanceOf(ForbiddenException.class);
    }

    @Test
    void createPeriodRejectsDuplicatePeriodKey() {
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of());
        when(corkboardRepository.existsByPeriodKey("2030-01")).thenReturn(true);

        assertThatThrownBy(() -> corkboardService.createPeriod(
                superAdminPrincipal(),
                new AdminCorkboardPeriodCreateRequest(
                        "2030-01",
                        "January Board",
                        LocalDate.of(2030, 1, 1),
                        LocalDate.of(2030, 1, 31)
                )
        )).isInstanceOf(BadRequestException.class);
    }

    @Test
    void createPeriodRejectsOverlappingActivePeriod() {
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of(currentBoard));
        when(corkboardRepository.existsByPeriodKey("2030-01")).thenReturn(false);
        when(corkboardRepository.findAllByOrderByPeriodStartDescPageNoAsc()).thenReturn(List.of(currentBoard));

        assertThatThrownBy(() -> corkboardService.createPeriod(
                superAdminPrincipal(),
                new AdminCorkboardPeriodCreateRequest(
                        "2030-01",
                        "Overlapping Board",
                        currentBoard.getPeriodStart().plusDays(1),
                        currentBoard.getPeriodEnd()
                )
        )).isInstanceOf(BadRequestException.class);
    }

    @Test
    void createPeriodCreatesFirstPageWhenPeriodDoesNotOverlap() {
        Corkboard futureBoard = periodBoard(
                20L,
                "2030-01",
                "January Board",
                LocalDate.of(2030, 1, 1),
                LocalDate.of(2030, 1, 31),
                1
        );
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of(currentBoard));
        when(corkboardRepository.existsByPeriodKey("2030-01")).thenReturn(false);
        when(corkboardRepository.findAllByOrderByPeriodStartDescPageNoAsc())
                .thenReturn(List.of(futureBoard, currentBoard));
        when(corkboardRepository.save(any(Corkboard.class))).thenReturn(futureBoard);
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(currentBoard.getPeriodKey()))
                .thenReturn(List.of(currentBoard));
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc("2030-01"))
                .thenReturn(List.of(futureBoard));
        when(noteRepository.findByBoardInOrderByBoard_PageNoAscSlotIndexAscIdAsc(any()))
                .thenReturn(List.of());

        corkboardService.createPeriod(
                superAdminPrincipal(),
                new AdminCorkboardPeriodCreateRequest(
                        "2030-01",
                        "January Board",
                        LocalDate.of(2030, 1, 1),
                        LocalDate.of(2030, 1, 31)
                )
        );

        ArgumentCaptor<Corkboard> boardCaptor = ArgumentCaptor.forClass(Corkboard.class);
        verify(corkboardRepository).save(boardCaptor.capture());
        Corkboard savedBoard = boardCaptor.getValue();

        assertThat(savedBoard.getPeriodKey()).isEqualTo("2030-01");
        assertThat(savedBoard.getTitle()).isEqualTo("January Board");
        assertThat(savedBoard.getPeriodStart()).isEqualTo(LocalDate.of(2030, 1, 1));
        assertThat(savedBoard.getPeriodEnd()).isEqualTo(LocalDate.of(2030, 1, 31));
        assertThat(savedBoard.getPageNo()).isEqualTo(1);
    }

    @Test
    void periodEndIsInclusiveForWritableCurrentBoard() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        Corkboard todayEndingBoard = periodBoard(
                30L,
                "2099-12",
                "Today Ending Board",
                today.minusDays(3),
                today,
                1
        );
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of(todayEndingBoard));
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc("2099-12"))
                .thenReturn(List.of(todayEndingBoard), List.of(todayEndingBoard));
        when(noteRepository.findByBoardInOrderByBoard_PageNoAscSlotIndexAscIdAsc(List.of(todayEndingBoard)))
                .thenReturn(List.of());

        CorkboardCollectionResponse response = corkboardService.findCurrentCorkboards();

        assertThat(response.periodKey()).isEqualTo("2099-12");
        assertThat(response.readOnly()).isFalse();
        assertThat(todayEndingBoard.getStatus()).isEqualTo(CorkboardStatus.ACTIVE);
    }

    @Test
    void futureScheduledBoardIsNotCurrentBeforePeriodStart() {
        YearMonth nextMonth = YearMonth.from(LocalDate.now(ZoneId.of("Asia/Seoul"))).plusMonths(1);
        String futurePeriodKey = nextMonth.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        Corkboard futureBoard = periodBoard(
                31L,
                futurePeriodKey,
                "Future Board",
                nextMonth.atDay(1),
                nextMonth.atEndOfMonth(),
                1
        );
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of(futureBoard));
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(currentBoard.getPeriodKey()))
                .thenReturn(List.of(), List.of(currentBoard));
        when(corkboardRepository.save(any(Corkboard.class))).thenReturn(currentBoard);
        when(noteRepository.findByBoardInOrderByBoard_PageNoAscSlotIndexAscIdAsc(List.of(currentBoard)))
                .thenReturn(List.of());

        CorkboardCollectionResponse response = corkboardService.findCurrentCorkboards();

        assertThat(response.periodKey()).isEqualTo(currentBoard.getPeriodKey());
        assertThat(response.periodKey()).isNotEqualTo(futurePeriodKey);
        assertThat(futureBoard.getStatus()).isEqualTo(CorkboardStatus.ACTIVE);
    }

    @Test
    void expiredActiveBoardAppearsInArchiveAfterPeriodEnd() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        Corkboard expiredBoard = periodBoard(
                32L,
                "2099-01",
                "Expired Board",
                today.minusDays(10),
                today.minusDays(1),
                1
        );
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of(expiredBoard));
        when(corkboardRepository.findAllByOrderByPeriodStartDescPageNoAsc()).thenReturn(List.of(expiredBoard));
        when(noteRepository.findByBoardInOrderByBoard_PageNoAscSlotIndexAscIdAsc(List.of(expiredBoard)))
                .thenReturn(List.of());

        List<CorkboardArchivePeriodResponse> response = corkboardService.findArchivePeriods();

        assertThat(expiredBoard.getStatus()).isEqualTo(CorkboardStatus.ARCHIVED);
        assertThat(response)
                .extracting(CorkboardArchivePeriodResponse::periodKey)
                .contains("2099-01");
    }

    @Test
    void updatePeriodAppliesToEveryBoardPageInSamePeriod() {
        Corkboard secondPage = currentBoard(2L, 2);
        LocalDate nextStart = currentBoard.getPeriodStart().plusDays(1);
        LocalDate nextEnd = currentBoard.getPeriodEnd();
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of(currentBoard, secondPage));
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(currentBoard.getPeriodKey()))
                .thenReturn(List.of(currentBoard, secondPage));
        when(corkboardRepository.findAllByOrderByPeriodStartDescPageNoAsc())
                .thenReturn(List.of(currentBoard, secondPage));
        when(noteRepository.findByBoardInOrderByBoard_PageNoAscSlotIndexAscIdAsc(any()))
                .thenReturn(List.of());

        corkboardService.updatePeriod(
                superAdminPrincipal(),
                currentBoard.getPeriodKey(),
                new AdminCorkboardPeriodUpdateRequest("Updated Board", nextStart, nextEnd)
        );

        assertThat(currentBoard.getTitle()).isEqualTo("Updated Board");
        assertThat(secondPage.getTitle()).isEqualTo("Updated Board");
        assertThat(currentBoard.getPeriodStart()).isEqualTo(nextStart);
        assertThat(secondPage.getPeriodStart()).isEqualTo(nextStart);
        assertThat(currentBoard.getPeriodEnd()).isEqualTo(nextEnd);
        assertThat(secondPage.getPeriodEnd()).isEqualTo(nextEnd);
    }

    @Test
    void archivePeriodRequiresSuperAdmin() {
        assertThatThrownBy(() -> corkboardService.archivePeriod(staffPrincipal(), currentBoard.getPeriodKey()))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void archivePeriodArchivesEveryBoardPageInSamePeriod() {
        Corkboard secondPage = currentBoard(2L, 2);
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of(currentBoard, secondPage));
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(currentBoard.getPeriodKey()))
                .thenReturn(List.of(currentBoard, secondPage));
        when(corkboardRepository.findAllByOrderByPeriodStartDescPageNoAsc())
                .thenReturn(List.of(currentBoard, secondPage));
        when(noteRepository.findByBoardInOrderByBoard_PageNoAscSlotIndexAscIdAsc(any()))
                .thenReturn(List.of());

        corkboardService.archivePeriod(superAdminPrincipal(), currentBoard.getPeriodKey());

        assertThat(currentBoard.getStatus()).isEqualTo(CorkboardStatus.ARCHIVED);
        assertThat(secondPage.getStatus()).isEqualTo(CorkboardStatus.ARCHIVED);
    }

    @Test
    void updateHiddenTogglesNoteVisibility() {
        CorkboardNote note = CorkboardNote.createMemberNote(currentBoard, member, "yellow", "hide me", 0);
        ReflectionTestUtils.setField(note, "id", 10L);
        when(noteRepository.findById(10L)).thenReturn(Optional.of(note));

        CorkboardNoteResponse response = corkboardService.updateHidden(
                staffPrincipal(),
                10L,
                new CorkboardNoteHiddenRequest(true)
        );

        assertThat(note.isHidden()).isTrue();
        assertThat(response.hidden()).isTrue();
    }

    private List<CorkboardNote> fullPageNotes(Corkboard board) {
        return java.util.stream.IntStream.range(0, CorkboardService.BOARD_SLOT_CAPACITY)
                .mapToObj(slot -> CorkboardNote.createOfficialNote(board, "Staff", "official", "note " + slot, slot))
                .toList();
    }

    private Corkboard currentBoard(Long id, int pageNo) {
        YearMonth month = YearMonth.from(LocalDate.now(ZoneId.of("Asia/Seoul")));
        String periodKey = month.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        Corkboard board = Corkboard.create(
                periodKey,
                "Agora Corkboard " + periodKey,
                month.atDay(1),
                month.atEndOfMonth(),
                pageNo
        );
        ReflectionTestUtils.setField(board, "id", id);
        return board;
    }

    private Corkboard periodBoard(Long id, String periodKey, String title, LocalDate start, LocalDate end, int pageNo) {
        Corkboard board = Corkboard.create(
                periodKey,
                title,
                start,
                end,
                pageNo
        );
        ReflectionTestUtils.setField(board, "id", id);
        return board;
    }

    private AdminPrincipal staffPrincipal() {
        return new AdminPrincipal(
                "staff-1",
                "Staff One",
                "staff",
                AdminRole.STAFF,
                List.of(AdminRole.STAFF),
                AdminLanguage.Kor
        );
    }

    private AdminPrincipal superAdminPrincipal() {
        return new AdminPrincipal(
                "super-1",
                "Super One",
                "super",
                AdminRole.SUPER_ADMIN,
                List.of(AdminRole.SUPER_ADMIN),
                AdminLanguage.Kor
        );
    }
}
