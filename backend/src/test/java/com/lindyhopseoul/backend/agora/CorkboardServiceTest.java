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
import com.lindyhopseoul.backend.exception.ConflictException;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import com.lindyhopseoul.backend.exception.UnauthorizedException;
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
    void createMemberNoteRequiresReplacementWhenOwnActiveMemberNoteExistsInSamePeriod() {
        CorkboardNote existingNote = CorkboardNote.createMemberNote(currentBoard, member, "yellow", "already here", 0);
        ReflectionTestUtils.setField(existingNote, "id", 100L);
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of());
        when(noteRepository.findByBoard_PeriodKeyAndMember_IdAndNoteTypeAndDeletedFalseOrderByCreatedAtAscIdAsc(
                currentBoard.getPeriodKey(),
                1L,
                CorkboardNoteType.MEMBER
        )).thenReturn(List.of(existingNote));

        assertThatThrownBy(() -> corkboardService.createMemberNote(
                1L,
                new CorkboardNoteCreateRequest("blue", "new note", 30.0, 40.0, 1.0, 1)
        ))
                .isInstanceOf(ConflictException.class)
                .hasMessage("CORKBOARD_MEMBER_NOTE_REPLACEMENT_REQUIRED");

        assertThat(existingNote.isDeleted()).isFalse();
    }

    @Test
    void createMemberNoteWithReplacementSoftDeletesOwnActiveMemberNoteAcrossPages() {
        Corkboard secondPage = currentBoard(2L, 2);
        CorkboardNote existingNote = CorkboardNote.createMemberNote(secondPage, member, "yellow", "old note", 5);
        ReflectionTestUtils.setField(existingNote, "id", 101L);
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of(currentBoard, secondPage));
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(currentBoard.getPeriodKey()))
                .thenReturn(
                        List.of(currentBoard, secondPage),
                        List.of(currentBoard, secondPage),
                        List.of(currentBoard, secondPage)
                );
        when(noteRepository.findByBoard_PeriodKeyAndMember_IdAndNoteTypeAndDeletedFalseOrderByCreatedAtAscIdAsc(
                currentBoard.getPeriodKey(),
                1L,
                CorkboardNoteType.MEMBER
        )).thenReturn(List.of(existingNote));
        when(noteRepository.findByBoardOrderBySlotIndexAscIdAsc(currentBoard)).thenReturn(List.of());
        when(noteRepository.findByBoardInOrderByBoard_PageNoAscSlotIndexAscIdAsc(List.of(currentBoard, secondPage)))
                .thenReturn(List.of(existingNote));

        CorkboardCollectionResponse response = corkboardService.createMemberNote(
                1L,
                new CorkboardNoteCreateRequest("blue", "replacement", 42.2, 55.5, -1.2, 1, true)
        );

        ArgumentCaptor<CorkboardNote> noteCaptor = ArgumentCaptor.forClass(CorkboardNote.class);
        verify(noteRepository).save(noteCaptor.capture());
        CorkboardNote savedNote = noteCaptor.getValue();

        assertThat(existingNote.isDeleted()).isTrue();
        assertThat(existingNote.getDeletedByMemberId()).isEqualTo(1L);
        assertThat(existingNote.getDeletedAt()).isNotNull();
        assertThat(savedNote.getContent()).isEqualTo("replacement");
        assertThat(savedNote.getPositionX()).isEqualTo(42.2);
        assertThat(savedNote.getPositionY()).isEqualTo(55.5);
        assertThat(savedNote.getPlacementMode()).isEqualTo(CorkboardNotePlacementMode.FREE);
        assertThat(response.replacedExisting()).isTrue();
        assertThat(response.replacedNoteId()).isEqualTo(101L);
        assertThat(response.pages().get(0).notes()).isEmpty();
    }

    @Test
    void createMemberNoteRejectsReplacementWhenOwnHiddenMemberNoteExists() {
        CorkboardNote hiddenNote = CorkboardNote.createMemberNote(currentBoard, member, "yellow", "needs review", 0);
        ReflectionTestUtils.setField(hiddenNote, "id", 102L);
        hiddenNote.setHidden(true);
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of());
        when(noteRepository.findByBoard_PeriodKeyAndMember_IdAndNoteTypeAndDeletedFalseOrderByCreatedAtAscIdAsc(
                currentBoard.getPeriodKey(),
                1L,
                CorkboardNoteType.MEMBER
        )).thenReturn(List.of(hiddenNote));

        assertThatThrownBy(() -> corkboardService.createMemberNote(
                1L,
                new CorkboardNoteCreateRequest("blue", "try again", 30.0, 40.0, 1.0, 1, true)
        ))
                .isInstanceOf(ConflictException.class)
                .hasMessage("CORKBOARD_MEMBER_NOTE_HIDDEN_REVIEW_REQUIRED");

        assertThat(hiddenNote.isDeleted()).isFalse();
    }

    @Test
    void deletedAndOtherMemberNotesDoNotBlockMemberNoteCreation() {
        Member otherMember = member(2L, "other@example.com", "Other", "Other");
        CorkboardNote deletedOwnNote = CorkboardNote.createMemberNote(currentBoard, member, "yellow", "deleted", 0);
        CorkboardNote otherMemberNote = CorkboardNote.createMemberNote(currentBoard, otherMember, "pink", "other", 1);
        ReflectionTestUtils.setField(deletedOwnNote, "id", 103L);
        ReflectionTestUtils.setField(otherMemberNote, "id", 104L);
        deletedOwnNote.softDelete(1L);
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of());
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(currentBoard.getPeriodKey()))
                .thenReturn(List.of(currentBoard), List.of(currentBoard), List.of(currentBoard));
        when(noteRepository.findByBoard_PeriodKeyAndMember_IdAndNoteTypeAndDeletedFalseOrderByCreatedAtAscIdAsc(
                currentBoard.getPeriodKey(),
                1L,
                CorkboardNoteType.MEMBER
        )).thenReturn(List.of());
        when(noteRepository.findByBoardOrderBySlotIndexAscIdAsc(currentBoard))
                .thenReturn(List.of(deletedOwnNote, otherMemberNote));
        when(noteRepository.findByBoardInOrderByBoard_PageNoAscSlotIndexAscIdAsc(List.of(currentBoard)))
                .thenReturn(List.of(deletedOwnNote, otherMemberNote));

        CorkboardCollectionResponse response = corkboardService.createMemberNote(
                1L,
                new CorkboardNoteCreateRequest("blue", "allowed", 30.0, 40.0, 1.0, 1)
        );

        ArgumentCaptor<CorkboardNote> noteCaptor = ArgumentCaptor.forClass(CorkboardNote.class);
        verify(noteRepository).save(noteCaptor.capture());
        assertThat(noteCaptor.getValue().getSlotIndex()).isEqualTo(2);
        assertThat(response.replacedExisting()).isFalse();
        assertThat(otherMemberNote.isDeleted()).isFalse();
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
    void updateMemberNotePositionMovesOwnNoteAndConvertsSlotPlacementToFree() {
        CorkboardNote note = CorkboardNote.createMemberNote(currentBoard, member, "yellow", "move me", 3);
        ReflectionTestUtils.setField(note, "id", 50L);
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(noteRepository.findById(50L)).thenReturn(Optional.of(note));
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of());
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(currentBoard.getPeriodKey()))
                .thenReturn(List.of(currentBoard));

        CorkboardNoteResponse response = corkboardService.updateMemberNotePosition(
                1L,
                50L,
                new CorkboardNotePositionRequest(62.84, 44.21, -3.44)
        );

        assertThat(note.getPositionX()).isEqualTo(62.8);
        assertThat(note.getPositionY()).isEqualTo(44.2);
        assertThat(note.getRotationDeg()).isEqualTo(-3.4);
        assertThat(note.getPlacementMode()).isEqualTo(CorkboardNotePlacementMode.FREE);
        assertThat(note.getSlotIndex()).isEqualTo(3);
        assertThat(response.positionEditable()).isTrue();
    }

    @Test
    void updateMemberNotePositionRejectsOtherMemberNote() {
        Member otherMember = member(2L, "other@example.com", "Other", "Other");
        CorkboardNote note = CorkboardNote.createMemberNote(currentBoard, otherMember, "yellow", "not mine", 0);
        ReflectionTestUtils.setField(note, "id", 51L);
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(noteRepository.findById(51L)).thenReturn(Optional.of(note));

        assertThatThrownBy(() -> corkboardService.updateMemberNotePosition(
                1L,
                51L,
                new CorkboardNotePositionRequest(50.0, 50.0, 0.0)
        )).isInstanceOf(ForbiddenException.class);
    }

    @Test
    void updateMemberNotePositionRejectsUnauthenticatedMember() {
        assertThatThrownBy(() -> corkboardService.updateMemberNotePosition(
                null,
                50L,
                new CorkboardNotePositionRequest(50.0, 50.0, 0.0)
        )).isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void updateMemberNotePositionRejectsArchivedBoard() {
        Corkboard archivedBoard = currentBoard(52L, 1);
        archivedBoard.archive();
        CorkboardNote note = CorkboardNote.createMemberNote(archivedBoard, member, "yellow", "past note", 0);
        ReflectionTestUtils.setField(note, "id", 52L);
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(noteRepository.findById(52L)).thenReturn(Optional.of(note));
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of());
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(archivedBoard.getPeriodKey()))
                .thenReturn(List.of(archivedBoard));

        assertThatThrownBy(() -> corkboardService.updateMemberNotePosition(
                1L,
                52L,
                new CorkboardNotePositionRequest(50.0, 50.0, 0.0)
        )).isInstanceOf(BadRequestException.class);
    }

    @Test
    void updateMemberNotePositionRejectsOutOfRangePlacementValues() {
        CorkboardNote note = CorkboardNote.createMemberNote(currentBoard, member, "yellow", "move me", 0);
        ReflectionTestUtils.setField(note, "id", 53L);
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(noteRepository.findById(53L)).thenReturn(Optional.of(note));
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of());
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(currentBoard.getPeriodKey()))
                .thenReturn(List.of(currentBoard));

        assertThatThrownBy(() -> corkboardService.updateMemberNotePosition(
                1L,
                53L,
                new CorkboardNotePositionRequest(100.1, 50.0, 0.0)
        )).isInstanceOf(BadRequestException.class);

        assertThatThrownBy(() -> corkboardService.updateMemberNotePosition(
                1L,
                53L,
                new CorkboardNotePositionRequest(50.0, -0.1, 0.0)
        )).isInstanceOf(BadRequestException.class);

        assertThatThrownBy(() -> corkboardService.updateMemberNotePosition(
                1L,
                53L,
                new CorkboardNotePositionRequest(50.0, 50.0, -6.1)
        )).isInstanceOf(BadRequestException.class);
    }

    @Test
    void updateMemberNoteContentUpdatesOwnVisibleMemberNote() {
        CorkboardNote note = CorkboardNote.createMemberNote(currentBoard, member, "yellow", "old content", 0);
        ReflectionTestUtils.setField(note, "id", 60L);
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(noteRepository.findById(60L)).thenReturn(Optional.of(note));
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of());
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(currentBoard.getPeriodKey()))
                .thenReturn(List.of(currentBoard));

        CorkboardNoteResponse response = corkboardService.updateMemberNoteContent(
                1L,
                60L,
                new CorkboardNoteContentRequest("  updated content  ")
        );

        assertThat(note.getContent()).isEqualTo("updated content");
        assertThat(note.getContentEditedAt()).isNotNull();
        assertThat(response.content()).isEqualTo("updated content");
        assertThat(response.contentEditable()).isTrue();
        assertThat(response.deletable()).isTrue();
    }

    @Test
    void updateMemberNoteContentRejectsOtherMemberOfficialHiddenArchivedAndInvalidContent() {
        Member otherMember = member(2L, "other@example.com", "Other", "Other");
        CorkboardNote otherNote = CorkboardNote.createMemberNote(currentBoard, otherMember, "yellow", "not mine", 0);
        CorkboardNote officialNote = CorkboardNote.createOfficialNote(currentBoard, "Staff", "official", "notice", 1);
        CorkboardNote hiddenNote = CorkboardNote.createMemberNote(currentBoard, member, "yellow", "hidden", 2);
        hiddenNote.setHidden(true);
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        Corkboard archivedBoard = periodBoard(
                61L,
                "2000-01",
                "Archived Board",
                today.minusDays(60),
                today.minusDays(30),
                1
        );
        archivedBoard.archive();
        CorkboardNote archivedNote = CorkboardNote.createMemberNote(archivedBoard, member, "yellow", "past", 0);
        CorkboardNote ownNote = CorkboardNote.createMemberNote(currentBoard, member, "yellow", "mine", 3);
        ReflectionTestUtils.setField(otherNote, "id", 61L);
        ReflectionTestUtils.setField(officialNote, "id", 62L);
        ReflectionTestUtils.setField(hiddenNote, "id", 63L);
        ReflectionTestUtils.setField(archivedNote, "id", 64L);
        ReflectionTestUtils.setField(ownNote, "id", 65L);
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(noteRepository.findById(61L)).thenReturn(Optional.of(otherNote));
        when(noteRepository.findById(62L)).thenReturn(Optional.of(officialNote));
        when(noteRepository.findById(63L)).thenReturn(Optional.of(hiddenNote));
        when(noteRepository.findById(64L)).thenReturn(Optional.of(archivedNote));
        when(noteRepository.findById(65L)).thenReturn(Optional.of(ownNote));
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of());
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(archivedBoard.getPeriodKey()))
                .thenReturn(List.of(archivedBoard));
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(currentBoard.getPeriodKey()))
                .thenReturn(List.of(currentBoard));

        assertThatThrownBy(() -> corkboardService.updateMemberNoteContent(
                1L,
                61L,
                new CorkboardNoteContentRequest("edit")
        )).isInstanceOf(ForbiddenException.class);
        assertThatThrownBy(() -> corkboardService.updateMemberNoteContent(
                1L,
                62L,
                new CorkboardNoteContentRequest("edit")
        )).isInstanceOf(ForbiddenException.class);
        assertThatThrownBy(() -> corkboardService.updateMemberNoteContent(
                1L,
                63L,
                new CorkboardNoteContentRequest("edit")
        )).isInstanceOf(ForbiddenException.class);
        assertThatThrownBy(() -> corkboardService.updateMemberNoteContent(
                1L,
                64L,
                new CorkboardNoteContentRequest("edit")
        )).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> corkboardService.updateMemberNoteContent(
                1L,
                65L,
                new CorkboardNoteContentRequest("   ")
        )).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> corkboardService.updateMemberNoteContent(
                1L,
                65L,
                new CorkboardNoteContentRequest("a".repeat(201))
        )).isInstanceOf(BadRequestException.class);
    }

    @Test
    void deleteMemberNoteSoftDeletesOwnVisibleMemberNote() {
        CorkboardNote note = CorkboardNote.createMemberNote(currentBoard, member, "yellow", "delete me", 0);
        ReflectionTestUtils.setField(note, "id", 66L);
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(noteRepository.findById(66L)).thenReturn(Optional.of(note));
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of());
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(currentBoard.getPeriodKey()))
                .thenReturn(List.of(currentBoard));

        corkboardService.deleteMemberNote(1L, 66L);

        assertThat(note.isDeleted()).isTrue();
        assertThat(note.getDeletedAt()).isNotNull();
        assertThat(note.getDeletedByMemberId()).isEqualTo(1L);
    }

    @Test
    void deletedNoteIsExcludedFromPublicPeriodAndCannotBeEditedAgain() {
        CorkboardNote deletedNote = CorkboardNote.createMemberNote(currentBoard, member, "yellow", "deleted", 0);
        CorkboardNote visibleNote = CorkboardNote.createMemberNote(currentBoard, member, "blue", "visible", 1);
        ReflectionTestUtils.setField(deletedNote, "id", 67L);
        deletedNote.softDelete(1L);
        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(noteRepository.findById(67L)).thenReturn(Optional.of(deletedNote));
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of());
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(currentBoard.getPeriodKey()))
                .thenReturn(List.of(currentBoard), List.of(currentBoard));
        when(noteRepository.findByBoardInOrderByBoard_PageNoAscSlotIndexAscIdAsc(List.of(currentBoard)))
                .thenReturn(List.of(deletedNote, visibleNote));

        CorkboardCollectionResponse response = corkboardService.findPeriod(currentBoard.getPeriodKey(), 1L);

        assertThat(response.pages().get(0).notes())
                .extracting(CorkboardNoteResponse::content)
                .containsExactly("visible");
        assertThatThrownBy(() -> corkboardService.updateMemberNoteContent(
                1L,
                67L,
                new CorkboardNoteContentRequest("again")
        )).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> corkboardService.deleteMemberNote(1L, 67L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void adminCanEditOfficialContentButNotMemberContent() {
        CorkboardNote officialNote = CorkboardNote.createOfficialNote(currentBoard, "Staff", "official", "old", 0);
        CorkboardNote memberNote = CorkboardNote.createMemberNote(currentBoard, member, "yellow", "member", 1);
        ReflectionTestUtils.setField(officialNote, "id", 68L);
        ReflectionTestUtils.setField(memberNote, "id", 69L);
        when(noteRepository.findById(68L)).thenReturn(Optional.of(officialNote));
        when(noteRepository.findById(69L)).thenReturn(Optional.of(memberNote));
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of());
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(currentBoard.getPeriodKey()))
                .thenReturn(List.of(currentBoard));

        CorkboardNoteResponse response = corkboardService.updateAdminOfficialNoteContent(
                staffPrincipal(),
                68L,
                new CorkboardNoteContentRequest("  new official  ")
        );

        assertThat(response.content()).isEqualTo("new official");
        assertThat(officialNote.getContentEditedAt()).isNotNull();
        assertThatThrownBy(() -> corkboardService.updateAdminOfficialNoteContent(
                staffPrincipal(),
                69L,
                new CorkboardNoteContentRequest("admin edit member")
        )).isInstanceOf(ForbiddenException.class);
    }

    @Test
    void updateAdminNotePositionMovesAnyCurrentBoardNote() {
        CorkboardNote note = CorkboardNote.createOfficialNote(currentBoard, "Staff", "official", "notice", 2);
        ReflectionTestUtils.setField(note, "id", 54L);
        when(noteRepository.findById(54L)).thenReturn(Optional.of(note));
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of());
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(currentBoard.getPeriodKey()))
                .thenReturn(List.of(currentBoard));

        CorkboardNoteResponse response = corkboardService.updateAdminNotePosition(
                staffPrincipal(),
                54L,
                new CorkboardNotePositionRequest(22.2, 77.7, 5.5)
        );

        assertThat(note.getPositionX()).isEqualTo(22.2);
        assertThat(note.getPositionY()).isEqualTo(77.7);
        assertThat(note.getRotationDeg()).isEqualTo(5.5);
        assertThat(note.getPlacementMode()).isEqualTo(CorkboardNotePlacementMode.FREE);
        assertThat(response.positionEditable()).isFalse();
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
    void createOfficialNoteStoresRequestedFreePlacement() {
        when(corkboardRepository.findByStatus(CorkboardStatus.ACTIVE)).thenReturn(List.of());
        when(corkboardRepository.findByPeriodKeyOrderByPageNoAsc(currentBoard.getPeriodKey()))
                .thenReturn(List.of(currentBoard), List.of(currentBoard), List.of(currentBoard));
        when(corkboardRepository.findAllByOrderByPeriodStartDescPageNoAsc()).thenReturn(List.of(currentBoard));
        when(noteRepository.findByBoardOrderBySlotIndexAscIdAsc(currentBoard)).thenReturn(List.of());
        when(noteRepository.findByBoardInOrderByBoard_PageNoAscSlotIndexAscIdAsc(List.of(currentBoard)))
                .thenReturn(List.of());

        corkboardService.createOfficialNote(
                staffPrincipal(),
                new AdminCorkboardNoteCreateRequest(
                        currentBoard.getPeriodKey(),
                        "official",
                        "placed official",
                        66.67,
                        42.24,
                        -4.26,
                        1
                )
        );

        ArgumentCaptor<CorkboardNote> noteCaptor = ArgumentCaptor.forClass(CorkboardNote.class);
        verify(noteRepository).save(noteCaptor.capture());
        CorkboardNote savedNote = noteCaptor.getValue();
        assertThat(savedNote.getNoteType()).isEqualTo(CorkboardNoteType.OFFICIAL);
        assertThat(savedNote.getPositionX()).isEqualTo(66.7);
        assertThat(savedNote.getPositionY()).isEqualTo(42.2);
        assertThat(savedNote.getRotationDeg()).isEqualTo(-4.3);
        assertThat(savedNote.getPlacementMode()).isEqualTo(CorkboardNotePlacementMode.FREE);
    }

    @Test
    void createOfficialNoteRejectsPastPeriod() {
        assertThatThrownBy(() -> corkboardService.createOfficialNote(
                staffPrincipal(),
                new AdminCorkboardNoteCreateRequest("1999-01", "official", "past note")
        )).isInstanceOf(BadRequestException.class);
    }

    @Test
    void adminActionsRejectRolelessAccount() {
        // An account nobody has granted a role to. There is no catch-all role
        // standing in for this any more, so it carries an empty role list.
        AdminPrincipal rolelessPrincipal = new AdminPrincipal(
                "no-role-1",
                "No Role",
                "norole",
                null,
                List.of(),
                AdminLanguage.Kor
        );

        assertThatThrownBy(() -> corkboardService.findAdminCorkboards(rolelessPrincipal, null))
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
                "Corkboard " + periodKey,
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

    private Member member(Long id, String email, String displayName, String nickname) {
        Member nextMember = Member.createGoogle(
                "google-sub-" + id,
                email,
                displayName,
                Instant.parse("2026-06-23T00:00:00Z")
        );
        nextMember.updateSettings(nickname, null);
        ReflectionTestUtils.setField(nextMember, "id", id);
        return nextMember;
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
