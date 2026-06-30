import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { corkboardApi } from "./api/corkboards";
import "./corkboard.css";

export const CORKBOARD_NOTE_TEMPLATES = [
  { key: "yellow", name: { ko: "노란 포스트잇", en: "Yellow note" } },
  { key: "pink", name: { ko: "분홍 메모지", en: "Pink note" } },
  { key: "blue", name: { ko: "연한 파랑 메모", en: "Blue note" } },
  { key: "white", name: { ko: "흰 종이 메모", en: "White paper" } },
  { key: "lined", name: { ko: "줄노트", en: "Lined note" } },
  { key: "tape", name: { ko: "테이프 메모", en: "Taped note" } },
  { key: "pin", name: { ko: "핀 메모", en: "Pinned note" } },
];

export const OFFICIAL_CORKBOARD_TEMPLATES = [
  { key: "official", name: { ko: "운영진 공지", en: "Staff notice" } },
  { key: "official-blue", name: { ko: "파란 공지", en: "Blue notice" } },
  ...CORKBOARD_NOTE_TEMPLATES,
];

const NOTE_ROTATIONS = [-2.5, 1.7, -0.8, 2.4, -1.6, 0.9, 1.2, -2.1, 2.8, -1.1, 1.9, -2.7];
const NOTE_X = [-4, 5, -1, 3, -6, 2, 4, -3, 6, -2, 1, -5];
const NOTE_Y = [3, -4, 1, 5, -2, 2, -5, 4, -1, 3, -3, 0];
const BOARD_SLOT_CAPACITY = 18;
const SLOT_FALLBACK_X = [13, 38, 63, 87];
const SLOT_FALLBACK_Y = [13, 31, 49, 67, 85];
const NOTE_EDGE_BUFFER = 9;
const NOTE_LONG_PRESS_MS = 380;
const LONG_PRESS_MOVE_TOLERANCE = 10;
const NOTE_SETTLE_MS = 260;
const NOTE_RETURN_MS = 260;

const COPY = {
  ko: {
    back: "메인으로",
    title: "Agora Corkboard",
    subtitle: "스윙팝 사람들의 짧은 안내와 마음을 코르크보드에 붙여두는 공간입니다.",
    current: "현재 보드",
    archive: "지난 코르크보드",
    archiveEmpty: "아직 지나간 코르크보드가 없습니다.",
    loading: "코르크보드를 꺼내는 중입니다.",
    loadError: "코르크보드를 불러오지 못했습니다.",
    emptyBoard: "아직 붙어 있는 메모가 없습니다.",
    readOnly: "지난 보드는 읽기 전용입니다.",
    readOnlyBody: "그때 붙었던 메모들을 천천히 구경해주세요.",
    board: "Board",
    writeTitle: "메모 붙이기",
    writeSubtitle: "템플릿과 내용을 정한 뒤, 보드 위 원하는 곳에 메모를 살짝 놓아주세요.",
    placementHint: "보드에서 위치를 탭하거나 미리보기 메모를 드래그해 붙일 자리를 정하세요.",
    placementReady: "선택한 위치에 붙일 준비가 되었습니다.",
    loginTitle: "메모를 붙이려면 로그인이 필요합니다.",
    loginBody: "구경은 누구나 가능하고, 작성은 스윙팝 회원 로그인 후 사용할 수 있습니다.",
    login: "Google로 로그인",
    preview: "미리보기",
    placeholder: "짧은 안내, 응원, 방명록처럼 남기고 싶은 말을 적어주세요.",
    remaining: (count) => `${count}자 남음`,
    submit: "보드에 붙이기",
    submitting: "붙이는 중",
    required: "메모 내용을 입력해주세요.",
    saved: "메모가 코르크보드에 붙었습니다.",
    saveError: "메모를 붙이지 못했습니다.",
    positionEditHint: "본인 메모는 길게 눌러 떼어낸 뒤 원하는 곳에 놓을 수 있습니다.",
    moveConfirmTitle: "이 위치로 메모를 옮길까요?",
    moveConfirmBody: "확인을 누르면 새 위치가 저장되고, 취소하면 원래 자리로 돌아갑니다.",
    confirmMove: "옮기기",
    moveSaving: "옮기는 중",
    cancelPosition: "취소",
    positionSaved: "메모 위치를 저장했습니다.",
    positionSaveError: "메모 위치를 저장하지 못했습니다.",
    staff: "운영진",
    friend: "스윙팝 친구",
  },
  en: {
    back: "Home",
    title: "Agora Corkboard",
    subtitle: "Short notes, guestbook messages, and warm SwingPop notices pinned in one place.",
    current: "Current board",
    archive: "Past corkboards",
    archiveEmpty: "No archived corkboards yet.",
    loading: "Opening the corkboard.",
    loadError: "Could not load the corkboard.",
    emptyBoard: "No notes have been pinned yet.",
    readOnly: "Past boards are read-only.",
    readOnlyBody: "Take your time looking through the notes from that month.",
    board: "Board",
    writeTitle: "Pin a note",
    writeSubtitle: "Pick a note style, write a short message, then place it where it belongs on the board.",
    placementHint: "Tap the board or drag the preview note to choose a spot.",
    placementReady: "Ready to pin at the selected spot.",
    loginTitle: "Log in to pin a note.",
    loginBody: "Everyone can look around. Writing is available after member login.",
    login: "Sign in with Google",
    preview: "Preview",
    placeholder: "Write a short notice, cheer, or guestbook message.",
    remaining: (count) => `${count} left`,
    submit: "Pin to board",
    submitting: "Pinning",
    required: "Please write a note.",
    saved: "Your note landed on the corkboard.",
    saveError: "Could not pin the note.",
    positionEditHint: "Long-press your own note, lift it, then drop it where it should live.",
    moveConfirmTitle: "Move the note here?",
    moveConfirmBody: "Confirm to save the new spot, or cancel to return it.",
    confirmMove: "Move",
    moveSaving: "Moving",
    cancelPosition: "Cancel",
    positionSaved: "Note position saved.",
    positionSaveError: "Could not save the note position.",
    staff: "Staff",
    friend: "SwingPop friend",
  },
};

function noteAuthor(note, labels) {
  if (note?.noteType === "OFFICIAL") {
    return note.authorNameSnapshot || labels.staff;
  }
  return note?.authorNicknameSnapshot || note?.authorNameSnapshot || labels.friend;
}

function formatDate(value, language) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "ko-KR", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function periodLabel(board, language) {
  if (!board?.periodStart || !board?.periodEnd) {
    return board?.periodKey || "";
  }
  const start = new Date(`${board.periodStart}T00:00:00`);
  const end = new Date(`${board.periodEnd}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return board.periodKey;
  }
  const locale = language === "en" ? "en-US" : "ko-KR";
  return `${new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(start)} - ${new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(end)}`;
}

function fixtureForNote(note) {
  const templateKey = note?.stickerTemplateKey || "";
  if (note?.noteType === "OFFICIAL" || templateKey.startsWith("official")) {
    return "official";
  }
  if (templateKey === "tape") {
    return "tape";
  }
  if (templateKey === "pin") {
    return "pin";
  }
  return note?.slotIndex % 3 === 0 ? "pin" : "tape";
}

function templateName(templates, templateKey, language) {
  return templates.find((template) => template.key === templateKey)?.name?.[language] || templateKey;
}

function flatNoteIds(boardData) {
  return new Set(
    (boardData?.pages || [])
      .flatMap((page) => page.notes || [])
      .map((note) => note.id)
      .filter(Boolean)
  );
}

function findNewNote(previousIds, boardData) {
  for (const [pageIndex, page] of (boardData?.pages || []).entries()) {
    for (const note of page.notes || []) {
      if (note.id && !previousIds.has(note.id)) {
        return { id: note.id, pageIndex };
      }
    }
  }
  return null;
}

function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function fallbackPlacement(slotIndex) {
  const safeSlot = Math.max(0, Number(slotIndex) || 0);
  const column = safeSlot % SLOT_FALLBACK_X.length;
  const row = Math.floor(safeSlot / SLOT_FALLBACK_X.length);
  return {
    positionX: clampNumber((SLOT_FALLBACK_X[column] || 50) + (NOTE_X[safeSlot % NOTE_X.length] || 0) * 0.4, NOTE_EDGE_BUFFER, 100 - NOTE_EDGE_BUFFER),
    positionY: clampNumber((SLOT_FALLBACK_Y[row] || 50) + (NOTE_Y[safeSlot % NOTE_Y.length] || 0) * 0.4, NOTE_EDGE_BUFFER, 100 - NOTE_EDGE_BUFFER),
  };
}

function notePlacement(note) {
  const positionX = finiteNumber(note?.positionX);
  const positionY = finiteNumber(note?.positionY);
  if (positionX !== null && positionY !== null) {
    return {
      positionX: clampNumber(positionX, NOTE_EDGE_BUFFER, 100 - NOTE_EDGE_BUFFER),
      positionY: clampNumber(positionY, NOTE_EDGE_BUFFER, 100 - NOTE_EDGE_BUFFER),
    };
  }
  return fallbackPlacement(note?.slotIndex || 0);
}

function noteRotation(note) {
  const rotation = finiteNumber(note?.rotationDeg);
  if (rotation !== null) {
    return clampNumber(rotation, -6, 6);
  }
  const slotIndex = Math.max(0, Number(note?.slotIndex) || 0);
  return NOTE_ROTATIONS[slotIndex % NOTE_ROTATIONS.length];
}

function noteZIndex(note, fallback = 1) {
  const zIndex = Number(note?.zIndex);
  if (Number.isFinite(zIndex)) {
    return Math.max(1, zIndex);
  }
  return Math.max(1, (Number(note?.slotIndex) || 0) + fallback);
}

function noteStyle(note, zIndexOverride) {
  const slotIndex = Math.max(0, Number(note?.slotIndex) || 0);
  const placement = notePlacement(note);
  return {
    "--note-rotate": `${noteRotation(note)}deg`,
    "--note-x": `${placement.positionX}%`,
    "--note-y": `${placement.positionY}%`,
    "--note-z": zIndexOverride || noteZIndex(note),
    "--note-delay": `${(slotIndex % 6) * 35}ms`,
  };
}

function draftRotation(selectedTemplate, content) {
  const templateIndex = CORKBOARD_NOTE_TEMPLATES.findIndex((template) => template.key === selectedTemplate);
  const seed = Math.max(0, templateIndex) + (content.trim().length % NOTE_ROTATIONS.length);
  return NOTE_ROTATIONS[seed % NOTE_ROTATIONS.length];
}

function writablePageIndex(boardData) {
  const pages = boardData?.pages || [];
  if (!pages.length || boardData?.readOnly) {
    return 0;
  }
  for (let index = pages.length - 1; index >= 0; index -= 1) {
    if ((pages[index]?.notes || []).length < BOARD_SLOT_CAPACITY) {
      return index;
    }
  }
  return Math.max(0, pages.length - 1);
}

function editablePlacementForNote(note) {
  const placement = notePlacement(note);
  return {
    positionX: placement.positionX,
    positionY: placement.positionY,
    rotationDeg: noteRotation(note),
  };
}

function roundedPlacement(placement) {
  return {
    positionX: Math.round((placement?.positionX || 0) * 10) / 10,
    positionY: Math.round((placement?.positionY || 0) * 10) / 10,
    rotationDeg: Math.round((placement?.rotationDeg || 0) * 10) / 10,
  };
}

function updateNoteInBoard(boardData, updatedNote) {
  if (!boardData || !updatedNote?.id) {
    return boardData;
  }
  return {
    ...boardData,
    pages: (boardData.pages || []).map((page) => ({
      ...page,
      notes: (page.notes || []).map((note) => (note.id === updatedNote.id ? { ...note, ...updatedNote } : note)),
    })),
  };
}

export function CorkboardNoteCard({
  note,
  language = "ko",
  isSelected = false,
  isFresh = false,
  adminControls = false,
  isDraft = false,
  isDragging = false,
  isPositionEditing = false,
  isMoveArmed = false,
  movementPhase = "",
  canEditPosition = false,
  zIndexOverride,
  onSelect,
  onToggleHidden,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}) {
  const labels = COPY[language] || COPY.ko;
  const templateKey = note?.stickerTemplateKey || "yellow";
  const fixture = fixtureForNote(note);
  const className = [
    "corkboard-note",
    `corkboard-template-${templateKey}`,
    note?.noteType === "OFFICIAL" ? "corkboard-note-official" : "",
    note?.hidden ? "corkboard-note-hidden" : "",
    isSelected ? "is-selected" : "",
    isFresh ? "is-fresh" : "",
    isDraft ? "is-draft" : "",
    isDragging ? "is-dragging" : "",
    isPositionEditing ? "is-position-editing" : "",
    isMoveArmed ? "is-move-armed" : "",
    movementPhase ? `is-note-${movementPhase}` : "",
    canEditPosition ? "is-position-editable" : "",
  ].filter(Boolean).join(" ");

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect?.(note);
    }
  };

  return (
    <article
      className={className}
      style={noteStyle(note, zIndexOverride || (isDraft ? 80 : undefined))}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => onSelect?.(note)}
      onKeyDown={handleKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel || onPointerUp}
    >
      <span className={`corkboard-fixture corkboard-fixture-${fixture}`} aria-hidden="true" />
      <div className="corkboard-note-content">{note.content}</div>
      <div className="corkboard-note-footer">
        <span>{noteAuthor(note, labels)}</span>
        <span>{formatDate(note.createdAt, language)}</span>
      </div>
      {adminControls ? (
        <button
          type="button"
          className="corkboard-note-admin-action"
          onClick={(event) => {
            event.stopPropagation();
            onToggleHidden?.(note);
          }}
        >
          {note.hidden ? "보이기" : "숨기기"}
        </button>
      ) : null}
    </article>
  );
}

export function CorkboardBoard({
  page,
  language = "ko",
  activeNoteId = null,
  freshNoteId = null,
  adminControls = false,
  draftNote = null,
  canPlaceNote = false,
  placementLabel = "",
  isDraftDragging = false,
  positionEdit = null,
  isPositionDragging = false,
  positionHoldNoteId = null,
  onNoteSelect,
  onToggleHidden,
  onDraftPlacementChange,
  onDraftDragChange,
  onEditPlacementChange,
  onEditDragChange,
  onStartPositionEdit,
  onDropPositionEdit,
  onCancelPositionEdit,
  onPositionHoldNoteChange,
  emptyLabel,
}) {
  const stageRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const longPressPointerRef = useRef(null);
  const notes = page?.notes || [];
  const hasNotes = notes.length > 0;

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressPointerRef.current = null;
    onPositionHoldNoteChange?.(null);
  }, [onPositionHoldNoteChange]);

  useEffect(() => () => clearLongPress(), [clearLongPress]);

  const placementFromEvent = useCallback((event) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      return null;
    }
    return {
      positionX: clampNumber(((event.clientX - rect.left) / rect.width) * 100, NOTE_EDGE_BUFFER, 100 - NOTE_EDGE_BUFFER),
      positionY: clampNumber(((event.clientY - rect.top) / rect.height) * 100, NOTE_EDGE_BUFFER, 100 - NOTE_EDGE_BUFFER),
    };
  }, []);

  const moveDraftToPointer = useCallback((event) => {
    const nextPlacement = placementFromEvent(event);
    if (nextPlacement) {
      onDraftPlacementChange?.(nextPlacement);
    }
  }, [onDraftPlacementChange, placementFromEvent]);

  const moveEditToPointer = useCallback((event) => {
    const nextPlacement = placementFromEvent(event);
    if (nextPlacement) {
      onEditPlacementChange?.(nextPlacement);
    }
  }, [onEditPlacementChange, placementFromEvent]);

  const handleStagePointerDown = (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!canPlaceNote || !draftNote || target?.closest(".corkboard-note")) {
      return;
    }
    moveDraftToPointer(event);
  };

  const handleDraftPointerDown = (event) => {
    if (!canPlaceNote || !draftNote) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onDraftDragChange?.(true);
    moveDraftToPointer(event);
  };

  const handleDraftPointerMove = (event) => {
    if (!isDraftDragging) {
      return;
    }
    event.preventDefault();
    moveDraftToPointer(event);
  };

  const handleDraftPointerUp = (event) => {
    if (!isDraftDragging) {
      return;
    }
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    onDraftDragChange?.(false);
  };

  const handleEditableNotePointerDown = (note, event) => {
    if (!note?.positionEditable || positionEdit) {
      return;
    }
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("button")) {
      return;
    }
    clearLongPress();
    const pointerState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      clientX: event.clientX,
      clientY: event.clientY,
      target: event.currentTarget,
      note,
      isActive: false,
    };
    longPressPointerRef.current = pointerState;
    onPositionHoldNoteChange?.(note.id);
    longPressTimerRef.current = window.setTimeout(() => {
      const currentPointer = longPressPointerRef.current;
      if (!currentPointer || currentPointer.pointerId !== pointerState.pointerId) {
        return;
      }
      longPressTimerRef.current = null;
      currentPointer.isActive = true;
      currentPointer.target?.setPointerCapture?.(currentPointer.pointerId);
      const originalPlacement = editablePlacementForNote(note);
      const nextPlacement = placementFromEvent(currentPointer);
      onStartPositionEdit?.(note, nextPlacement ? { ...originalPlacement, ...nextPlacement } : originalPlacement);
      onEditDragChange?.(true);
      onPositionHoldNoteChange?.(null);
    }, NOTE_LONG_PRESS_MS);
  };

  const handleEditableNotePointerMove = (note, event) => {
    const pointerState = longPressPointerRef.current;
    if (!pointerState || pointerState.pointerId !== event.pointerId || pointerState.note?.id !== note.id) {
      return;
    }
    pointerState.clientX = event.clientX;
    pointerState.clientY = event.clientY;
    if (pointerState.isActive) {
      event.preventDefault();
      event.stopPropagation();
      moveEditToPointer(event);
      return;
    }
    const distance = Math.hypot(event.clientX - pointerState.startX, event.clientY - pointerState.startY);
    if (distance > LONG_PRESS_MOVE_TOLERANCE) {
      clearLongPress();
    }
  };

  const handleEditableNotePointerUp = (note, event) => {
    const pointerState = longPressPointerRef.current;
    if (!pointerState || pointerState.pointerId !== event.pointerId || pointerState.note?.id !== note.id) {
      return;
    }
    if (pointerState.isActive) {
      event.preventDefault();
      event.stopPropagation();
      pointerState.target?.releasePointerCapture?.(event.pointerId);
      onEditDragChange?.(false);
      onDropPositionEdit?.();
      longPressPointerRef.current = null;
      onPositionHoldNoteChange?.(null);
      return;
    }
    clearLongPress();
  };

  const handleEditableNotePointerCancel = (note, event) => {
    const pointerState = longPressPointerRef.current;
    if (pointerState?.pointerId === event.pointerId && pointerState.note?.id === note.id && pointerState.isActive) {
      pointerState.target?.releasePointerCapture?.(event.pointerId);
      onEditDragChange?.(false);
      onCancelPositionEdit?.();
    }
    clearLongPress();
  };

  return (
    <section
      ref={stageRef}
      className={`corkboard-stage ${canPlaceNote || positionEdit ? "is-placement-enabled" : ""} ${isDraftDragging || isPositionDragging ? "is-dragging-note" : ""}`}
      aria-label={page?.title || "Agora Corkboard"}
      onPointerDown={handleStagePointerDown}
    >
      <div className="corkboard-slots">
        {notes.map((note) => {
          const isEditingThisNote = positionEdit?.noteId === note.id;
          const canMoveThisNote = Boolean(note.positionEditable);
          const shouldWirePositionPointer = canMoveThisNote && (!positionEdit || isEditingThisNote);
          const movementPhase = isEditingThisNote
            ? (isPositionDragging ? "dragging" : positionEdit?.phase || "lifted")
            : "";
          const renderedNote = isEditingThisNote
            ? {
                ...note,
                positionX: positionEdit.placement.positionX,
                positionY: positionEdit.placement.positionY,
                rotationDeg: positionEdit.placement.rotationDeg,
                placementMode: "FREE",
              }
            : note;
          return (
            <CorkboardNoteCard
              key={note.id || `${note.boardId}-${note.slotIndex}`}
              note={renderedNote}
              language={language}
              isSelected={activeNoteId === note.id}
              isFresh={freshNoteId === note.id}
              adminControls={adminControls}
              isPositionEditing={isEditingThisNote}
              isMoveArmed={positionHoldNoteId === note.id}
              isDragging={isEditingThisNote && isPositionDragging}
              movementPhase={movementPhase}
              canEditPosition={canMoveThisNote && !positionEdit}
              zIndexOverride={isEditingThisNote ? 95 : undefined}
              onSelect={onNoteSelect}
              onToggleHidden={onToggleHidden}
              onPointerDown={shouldWirePositionPointer ? (event) => handleEditableNotePointerDown(note, event) : undefined}
              onPointerMove={shouldWirePositionPointer ? (event) => handleEditableNotePointerMove(note, event) : undefined}
              onPointerUp={shouldWirePositionPointer ? (event) => handleEditableNotePointerUp(note, event) : undefined}
              onPointerCancel={shouldWirePositionPointer ? (event) => handleEditableNotePointerCancel(note, event) : undefined}
            />
          );
        })}
        {draftNote ? (
          <CorkboardNoteCard
            note={draftNote}
            language={language}
            isDraft
            isDragging={isDraftDragging}
            onPointerDown={handleDraftPointerDown}
            onPointerMove={handleDraftPointerMove}
            onPointerUp={handleDraftPointerUp}
          />
        ) : null}
      </div>
      {!hasNotes && !draftNote ? <div className="corkboard-empty">{emptyLabel}</div> : null}
      {canPlaceNote ? <div className="corkboard-placement-tip">{placementLabel}</div> : null}
    </section>
  );
}

export default function CorkboardPage({ authState, isLoading, language = "ko", onLogin, onBack }) {
  const labels = COPY[language] || COPY.ko;
  const [boardData, setBoardData] = useState(null);
  const [archivePeriods, setArchivePeriods] = useState([]);
  const [selectedPeriodKey, setSelectedPeriodKey] = useState("current");
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState("yellow");
  const [content, setContent] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isBoardLoading, setIsBoardLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [freshNoteId, setFreshNoteId] = useState(null);
  const [draftPlacement, setDraftPlacement] = useState({ positionX: 50, positionY: 50 });
  const [isDraftDragging, setIsDraftDragging] = useState(false);
  const [positionEdit, setPositionEdit] = useState(null);
  const [isPositionDragging, setIsPositionDragging] = useState(false);
  const [positionHoldNoteId, setPositionHoldNoteId] = useState(null);
  const [isPositionSaving, setIsPositionSaving] = useState(false);
  const positionSettleTimerRef = useRef(null);
  const positionReturnTimerRef = useRef(null);

  const clearPositionAnimationTimers = useCallback(() => {
    if (positionSettleTimerRef.current) {
      window.clearTimeout(positionSettleTimerRef.current);
      positionSettleTimerRef.current = null;
    }
    if (positionReturnTimerRef.current) {
      window.clearTimeout(positionReturnTimerRef.current);
      positionReturnTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearPositionAnimationTimers(), [clearPositionAnimationTimers]);

  const loadArchivePeriods = useCallback(async () => {
    const periods = await corkboardApi.findArchivePeriods();
    setArchivePeriods(Array.isArray(periods) ? periods : []);
  }, []);

  const loadCurrent = useCallback(async () => {
    setIsBoardLoading(true);
    setError("");
    try {
      const current = await corkboardApi.findCurrent();
      setBoardData(current);
      setSelectedPeriodKey("current");
      setActivePageIndex(writablePageIndex(current));
      clearPositionAnimationTimers();
      setPositionEdit(null);
      setPositionHoldNoteId(null);
    } catch (nextError) {
      setError(nextError.message || labels.loadError);
    } finally {
      setIsBoardLoading(false);
    }
  }, [labels.loadError]);

  const loadPeriod = useCallback(async (periodKey) => {
    if (!periodKey || periodKey === "current") {
      await loadCurrent();
      return;
    }
    setIsBoardLoading(true);
    setError("");
    try {
      const period = await corkboardApi.findByPeriod(periodKey);
      setBoardData(period);
      setSelectedPeriodKey(periodKey);
      setActivePageIndex(0);
      clearPositionAnimationTimers();
      setPositionEdit(null);
      setPositionHoldNoteId(null);
    } catch (nextError) {
      setError(nextError.message || labels.loadError);
    } finally {
      setIsBoardLoading(false);
    }
  }, [labels.loadError, loadCurrent]);

  useEffect(() => {
    loadCurrent();
    loadArchivePeriods().catch(() => setArchivePeriods([]));
  }, [loadArchivePeriods, loadCurrent]);

  useEffect(() => {
    if (!boardData?.pages?.length) {
      setActivePageIndex(0);
      clearPositionAnimationTimers();
      setPositionEdit(null);
      setPositionHoldNoteId(null);
      return;
    }
    if (activePageIndex >= boardData.pages.length) {
      setActivePageIndex(0);
    }
  }, [activePageIndex, boardData?.pages?.length]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const activePage = boardData?.pages?.[activePageIndex] || boardData?.pages?.[0] || null;
  const canWrite = Boolean(authState?.authenticated) && !boardData?.readOnly;
  const isEditingPosition = Boolean(positionEdit);
  const remaining = 200 - content.length;
  const currentDraftRotation = useMemo(
    () => draftRotation(selectedTemplate, content),
    [content, selectedTemplate]
  );
  const previewNote = useMemo(() => ({
    id: "preview",
    noteType: "MEMBER",
    stickerTemplateKey: selectedTemplate,
    content: content.trim() || labels.placeholder,
    slotIndex: 1,
    positionX: draftPlacement.positionX,
    positionY: draftPlacement.positionY,
    rotationDeg: currentDraftRotation,
    zIndex: 80,
    placementMode: "FREE",
    authorNicknameSnapshot: authState?.nickname || authState?.displayName || labels.friend,
    authorNameSnapshot: authState?.displayName || labels.friend,
    createdAt: new Date().toISOString(),
  }), [
    authState?.displayName,
    authState?.nickname,
    content,
    currentDraftRotation,
    draftPlacement.positionX,
    draftPlacement.positionY,
    labels.friend,
    labels.placeholder,
    selectedTemplate,
  ]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const normalizedContent = content.trim();
    if (!normalizedContent) {
      setError(labels.required);
      return;
    }

    const previousIds = flatNoteIds(boardData);
    setIsSubmitting(true);
    try {
      const nextBoard = await corkboardApi.createNote({
        stickerTemplateKey: selectedTemplate,
        content: normalizedContent,
        positionX: Math.round(draftPlacement.positionX * 10) / 10,
        positionY: Math.round(draftPlacement.positionY * 10) / 10,
        rotationDeg: currentDraftRotation,
        pageNo: activePage?.pageNo,
      });
      setBoardData(nextBoard);
      const newNote = findNewNote(previousIds, nextBoard);
      if (newNote) {
        setActivePageIndex(newNote.pageIndex);
        setActiveNoteId(newNote.id);
        setFreshNoteId(newNote.id);
        window.setTimeout(() => setFreshNoteId(null), 1600);
      }
      setContent("");
      setDraftPlacement({ positionX: 50, positionY: 50 });
      setNotice(labels.saved);
      loadArchivePeriods().catch(() => null);
    } catch (nextError) {
      setError(nextError.message || labels.saveError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartPositionEdit = (note, initialPlacement = null) => {
    if (!note?.positionEditable) {
      return;
    }
    clearPositionAnimationTimers();
    const originalPlacement = editablePlacementForNote(note);
    const placement = initialPlacement || originalPlacement;
    setError("");
    setNotice("");
    setActiveNoteId(note.id);
    setPositionEdit({
      noteId: note.id,
      originalPlacement,
      placement,
      phase: "dragging",
    });
  };

  const handleCancelPositionEdit = () => {
    clearPositionAnimationTimers();
    setIsPositionDragging(false);
    setPositionHoldNoteId(null);
    setPositionEdit((current) => {
      if (!current) {
        return null;
      }
      return {
        ...current,
        placement: current.originalPlacement,
        phase: "returning",
      };
    });
    positionReturnTimerRef.current = window.setTimeout(() => {
      setPositionEdit(null);
      positionReturnTimerRef.current = null;
    }, NOTE_RETURN_MS);
  };

  const handleDropPositionEdit = () => {
    clearPositionAnimationTimers();
    setIsPositionDragging(false);
    setPositionHoldNoteId(null);
    setPositionEdit((current) => current
      ? { ...current, phase: "dropping" }
      : current);
    positionSettleTimerRef.current = window.setTimeout(() => {
      setPositionEdit((current) => current?.phase === "dropping"
        ? { ...current, phase: "confirming" }
        : current);
      positionSettleTimerRef.current = null;
    }, NOTE_SETTLE_MS);
  };

  const handleSavePositionEdit = async () => {
    if (!positionEdit?.noteId || isPositionSaving) {
      return;
    }
    setError("");
    setNotice("");
    clearPositionAnimationTimers();
    setIsPositionSaving(true);
    try {
      const updatedNote = await corkboardApi.updateNotePosition(
        positionEdit.noteId,
        roundedPlacement(positionEdit.placement)
      );
      setBoardData((current) => updateNoteInBoard(current, updatedNote));
      setActiveNoteId(updatedNote.id);
      setFreshNoteId(updatedNote.id);
      window.setTimeout(() => setFreshNoteId(null), 1200);
      clearPositionAnimationTimers();
      setPositionEdit(null);
      setIsPositionDragging(false);
      setPositionHoldNoteId(null);
      setNotice(labels.positionSaved);
    } catch (nextError) {
      setError(nextError.message || labels.positionSaveError);
    } finally {
      setIsPositionSaving(false);
    }
  };

  const isMoveConfirmOpen = Boolean(positionEdit && !isPositionDragging && positionEdit.phase !== "returning");

  useEffect(() => {
    if (!isMoveConfirmOpen) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isPositionSaving) {
        handleCancelPositionEdit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMoveConfirmOpen, isPositionSaving, positionEdit]);

  return (
    <main className={`corkboard-page ${isMoveConfirmOpen ? "is-move-confirm-open" : ""}`}>
      <header className="corkboard-hero">
        <button type="button" className="corkboard-back-button" onClick={onBack}>
          {labels.back}
        </button>
        <div>
          <p className="corkboard-kicker">SwingPop Community Wall</p>
          <h1>{labels.title}</h1>
          <p>{labels.subtitle}</p>
        </div>
      </header>

      <section className="corkboard-toolbar" aria-label="Corkboard controls">
        <button
          type="button"
          className={`corkboard-period-button ${selectedPeriodKey === "current" ? "is-active" : ""}`}
          onClick={() => loadPeriod("current")}
        >
          {labels.current}
        </button>
        <label className="corkboard-archive-select">
          <span>{labels.archive}</span>
          <select
            value={selectedPeriodKey === "current" ? "" : selectedPeriodKey}
            onChange={(event) => loadPeriod(event.target.value || "current")}
          >
            <option value="">{labels.archiveEmpty}</option>
            {archivePeriods.map((period) => (
              <option key={period.periodKey} value={period.periodKey}>
                {period.periodKey} · {period.noteCount}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="corkboard-layout">
        <div className="corkboard-board-column">
          <div className="corkboard-board-heading">
            <div>
              <h2>{boardData?.title || labels.title}</h2>
              <p>{periodLabel(boardData, language)}</p>
            </div>
            {boardData?.readOnly ? <span className="corkboard-readonly-badge">{labels.readOnly}</span> : null}
          </div>

          {boardData?.pages?.length > 1 ? (
            <div className="corkboard-page-tabs" role="tablist" aria-label="Corkboard pages">
              {boardData.pages.map((page, index) => (
                <button
                  key={page.id || page.pageNo}
                  type="button"
                  className={index === activePageIndex ? "is-active" : ""}
                  onClick={() => setActivePageIndex(index)}
                >
                  {labels.board} {page.pageNo}
                </button>
              ))}
            </div>
          ) : null}

          {isBoardLoading || isLoading ? (
            <div className="corkboard-state">{labels.loading}</div>
          ) : error && !boardData ? (
            <div className="corkboard-state is-error">{error}</div>
          ) : (
            <CorkboardBoard
              page={activePage}
              language={language}
              activeNoteId={activeNoteId}
              freshNoteId={freshNoteId}
              draftNote={canWrite && !isEditingPosition ? previewNote : null}
              canPlaceNote={canWrite && !isSubmitting && !isEditingPosition}
              placementLabel={isEditingPosition ? labels.positionEditHint : (isDraftDragging ? labels.placementReady : labels.placementHint)}
              isDraftDragging={isDraftDragging}
              positionEdit={positionEdit}
              isPositionDragging={isPositionDragging}
              positionHoldNoteId={positionHoldNoteId}
              onNoteSelect={(note) => setActiveNoteId((currentId) => (currentId === note.id ? null : note.id))}
              onDraftPlacementChange={setDraftPlacement}
              onDraftDragChange={setIsDraftDragging}
              onEditPlacementChange={(nextPlacement) => {
                setPositionEdit((current) => current
                  ? { ...current, placement: { ...current.placement, ...nextPlacement } }
                  : current);
              }}
              onEditDragChange={setIsPositionDragging}
              onStartPositionEdit={handleStartPositionEdit}
              onDropPositionEdit={handleDropPositionEdit}
              onCancelPositionEdit={handleCancelPositionEdit}
              onPositionHoldNoteChange={setPositionHoldNoteId}
              emptyLabel={labels.emptyBoard}
            />
          )}

          {isMoveConfirmOpen ? (
            <div
              className="corkboard-move-confirm-overlay"
              role="presentation"
              onClick={isPositionSaving ? undefined : handleCancelPositionEdit}
            >
              <div
                className="corkboard-move-confirm"
                role="dialog"
                aria-modal="true"
                aria-live="polite"
                aria-label={labels.moveConfirmTitle}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="corkboard-move-confirm-copy">
                  <strong>{labels.moveConfirmTitle}</strong>
                  <span>{labels.moveConfirmBody}</span>
                </div>
                <div className="corkboard-move-confirm-actions">
                  <button type="button" onClick={handleCancelPositionEdit} disabled={isPositionSaving}>
                    {labels.cancelPosition}
                  </button>
                  <button type="button" onClick={handleSavePositionEdit} disabled={isPositionSaving} autoFocus>
                    {isPositionSaving ? labels.moveSaving : labels.confirmMove}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="corkboard-composer">
          {boardData?.readOnly ? (
            <div className="corkboard-login-card">
              <div className="corkboard-login-sticker-stack" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <h2>{labels.readOnly}</h2>
              <p>{labels.readOnlyBody}</p>
            </div>
          ) : !authState?.authenticated ? (
            <div className="corkboard-login-card">
              <div className="corkboard-login-sticker-stack" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <h2>{labels.loginTitle}</h2>
              <p>{labels.loginBody}</p>
              <button type="button" onClick={onLogin}>{labels.login}</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="corkboard-composer-head">
                <h2>{labels.writeTitle}</h2>
                <p>{labels.writeSubtitle}</p>
              </div>

              <div className="corkboard-template-grid" role="radiogroup" aria-label="Sticker templates">
                {CORKBOARD_NOTE_TEMPLATES.map((template) => (
                  <button
                    key={template.key}
                    type="button"
                    className={`corkboard-template-choice corkboard-template-${template.key} ${selectedTemplate === template.key ? "is-active" : ""}`}
                    onClick={() => setSelectedTemplate(template.key)}
                    aria-pressed={selectedTemplate === template.key}
                  >
                    <span>{template.name[language]}</span>
                  </button>
                ))}
              </div>

              <div className="corkboard-preview">
                <span>{labels.preview}</span>
                <CorkboardNoteCard note={previewNote} language={language} />
              </div>

              <textarea
                value={content}
                maxLength={200}
                onChange={(event) => setContent(event.target.value.slice(0, 200))}
                placeholder={labels.placeholder}
              />
              <div className="corkboard-composer-bottom">
                <span>{labels.remaining(Math.max(remaining, 0))}</span>
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? labels.submitting : labels.submit}
                </button>
              </div>
              {notice ? <div className="corkboard-form-notice">{notice}</div> : null}
              {error ? <div className="corkboard-form-error">{error}</div> : null}
            </form>
          )}
        </aside>
      </section>
    </main>
  );
}
