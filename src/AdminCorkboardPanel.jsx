import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { adminApi } from "./api/admin";
import { CorkboardBoard, OFFICIAL_CORKBOARD_TEMPLATES } from "./CorkboardPage";
import "./corkboard.css";

const COPY = {
  Kor: {
    title: "담벼락",
    description: "운영진 공지와 회원 메모가 섞여 보이는 커뮤니티 코르크보드를 관리합니다.",
    boardSettingsTitle: "보드 운영 설정",
    boardSettingsDescription: "선택한 보드의 사용 기간을 확인하고, 다음 코르크보드를 예약합니다.",
    currentBoardInfo: "선택한 보드 정보",
    current: "현재 보드",
    periods: "기간",
    periodArchiveTitle: "지난 보드 목록",
    periodArchiveEmpty: "아직 지난 보드가 없습니다.",
    periodKey: "periodKey",
    periodTitle: "보드 제목",
    periodStart: "시작일",
    periodEnd: "종료일",
    pageCount: "페이지 수",
    noteCount: "메모 수",
    writable: "작성 가능",
    notWritable: "읽기 전용",
    saveSettings: "기간 설정 저장",
    savingSettings: "저장 중",
    editPeriodTitle: "기간 수정",
    editPeriodDescription: "선택한 보드의 제목과 사용 기간을 변경합니다.",
    expandSection: "펼치기",
    collapseSection: "접기",
    settingsSaved: "보드 설정을 저장했습니다.",
    settingsSaveError: "보드 설정을 저장하지 못했습니다.",
    archiveCurrent: "현재 보드 종료",
    archivingCurrent: "종료 중",
    archiveSaved: "현재 보드를 종료했습니다.",
    archiveError: "현재 보드를 종료하지 못했습니다.",
    archiveConfirm: (periodKey) => `${periodKey} 보드를 종료하고 읽기 전용으로 전환할까요?`,
    createPeriodTitle: "새 보드 생성 / 예약",
    createPeriodDescription: "겹치지 않는 기간으로 새 Corkboard Board 1을 만듭니다.",
    createPeriod: "새 보드 생성",
    creatingPeriod: "생성 중",
    periodCreated: "새 보드를 생성했습니다.",
    periodCreateError: "새 보드를 생성하지 못했습니다.",
    superAdminOnly: "기간 수정, 새 보드 생성, 수동 종료는 SUPER_ADMIN만 사용할 수 있습니다.",
    noCurrentBoard: "현재 표시할 보드가 없습니다.",
    periodKeyInvalid: "periodKey는 YYYYMM 형식의 숫자 6자리로 입력해주세요.",
    periodTitleRequired: "보드 제목을 입력해주세요.",
    periodDateRequired: "시작일과 종료일을 입력해주세요.",
    periodRangeInvalid: "시작일은 종료일보다 이전이어야 합니다.",
    openPeriod: "보기",
    empty: "아직 붙어 있는 메모가 없습니다.",
    loading: "코르크보드를 불러오는 중입니다.",
    loadError: "코르크보드를 불러오지 못했습니다.",
    createTitle: "운영진 공지 붙이기",
    createDescription: "공지 스티커는 일반 메모보다 더 눈에 띄게 표시됩니다.",
    contentPlaceholder: "운영진 공지 내용을 200자 안으로 적어주세요.",
    remaining: (count) => `${count}자 남음`,
    submit: "공지 붙이기",
    submitting: "붙이는 중",
    saved: "운영진 공지가 붙었습니다.",
    saveError: "운영진 공지를 붙이지 못했습니다.",
    required: "공지 내용을 입력해주세요.",
    readOnly: "지난 보드는 읽기 전용입니다.",
    hiddenUpdated: "숨김 상태를 변경했습니다.",
    hiddenError: "숨김 상태를 변경하지 못했습니다.",
    board: "Board",
    preview: "미리보기",
    view: "보기",
    noteListView: "메모 모아보기",
    manageView: "관리용 보기",
    boardPreviewView: "보드 미리보기",
    noteListCount: (count) => `메모 ${count}개`,
    collapse: "접기",
    hide: "숨기기",
    unhide: "숨김 해제",
    hidden: "숨김",
    visible: "노출",
    official: "운영진 공지",
    member: "회원 메모",
    author: "작성자",
    createdAt: "작성일",
    type: "유형",
    template: "템플릿",
    page: "페이지",
    slot: "슬롯",
    positionX: "X 좌표",
    positionY: "Y 좌표",
    rotationDeg: "회전",
    zIndex: "쌓임",
    placementMode: "배치",
    slotFallback: "슬롯 fallback",
    savePosition: "위치 저장",
    savingPosition: "위치 저장 중",
    positionSaved: "메모 위치를 저장했습니다.",
    positionSaveError: "메모 위치를 저장하지 못했습니다.",
    editContent: "공지 수정",
    saveContent: "내용 저장",
    savingContent: "내용 저장 중",
    cancel: "취소",
    contentSaved: "운영진 공지 내용을 수정했습니다.",
    contentSaveError: "운영진 공지 내용을 수정하지 못했습니다.",
    previewPlacementHint: "보드에서 공지 위치를 탭하거나 미리보기 공지를 드래그해 붙일 자리를 정하세요.",
    previewPlacementReady: "선택한 위치로 운영진 공지가 등록됩니다.",
    previewPlacement: "공지 위치",
    resetPlacement: "추천 위치",
    status: "상태",
    yes: "예",
    no: "아니오",
    unknownAuthor: "작성자 없음",
  },
  Eng: {
    title: "Corkboard",
    description: "Manage the community corkboard where staff notices and member notes live together.",
    boardSettingsTitle: "Board Settings",
    boardSettingsDescription: "Review the selected board period and schedule the next corkboard.",
    currentBoardInfo: "Selected board info",
    current: "Current board",
    periods: "Periods",
    periodArchiveTitle: "Past boards",
    periodArchiveEmpty: "No past boards yet.",
    periodKey: "periodKey",
    periodTitle: "Board title",
    periodStart: "Start date",
    periodEnd: "End date",
    pageCount: "Pages",
    noteCount: "Notes",
    writable: "Writable",
    notWritable: "Read-only",
    saveSettings: "Save Period",
    savingSettings: "Saving",
    editPeriodTitle: "Edit Period",
    editPeriodDescription: "Change the selected board's title and active dates.",
    expandSection: "Expand",
    collapseSection: "Collapse",
    settingsSaved: "Board settings saved.",
    settingsSaveError: "Could not save board settings.",
    archiveCurrent: "Archive Current Board",
    archivingCurrent: "Archiving",
    archiveSaved: "Current board archived.",
    archiveError: "Could not archive the current board.",
    archiveConfirm: (periodKey) => `Archive ${periodKey} and make it read-only?`,
    createPeriodTitle: "Create / Schedule Board",
    createPeriodDescription: "Create Board 1 for a new non-overlapping corkboard period.",
    createPeriod: "Create Board",
    creatingPeriod: "Creating",
    periodCreated: "New board created.",
    periodCreateError: "Could not create the new board.",
    superAdminOnly: "Only SUPER_ADMIN can edit periods, create boards, or archive the current board.",
    noCurrentBoard: "No current board is available.",
    periodKeyInvalid: "Use six digits in YYYYMM format for periodKey.",
    periodTitleRequired: "Enter a board title.",
    periodDateRequired: "Enter both start and end dates.",
    periodRangeInvalid: "Start date must be before end date.",
    openPeriod: "View",
    empty: "No notes have been pinned yet.",
    loading: "Loading corkboards.",
    loadError: "Could not load corkboards.",
    createTitle: "Pin a staff notice",
    createDescription: "Staff notices are styled to stand out from member notes.",
    contentPlaceholder: "Write a staff notice in 200 characters or fewer.",
    remaining: (count) => `${count} left`,
    submit: "Pin notice",
    submitting: "Pinning",
    saved: "Staff notice pinned.",
    saveError: "Could not pin the staff notice.",
    required: "Please write a notice.",
    readOnly: "Past boards are read-only.",
    hiddenUpdated: "Visibility updated.",
    hiddenError: "Could not update visibility.",
    board: "Board",
    preview: "Preview",
    view: "View",
    noteListView: "Note List",
    manageView: "Management View",
    boardPreviewView: "Board Preview",
    noteListCount: (count) => `${count} note${count === 1 ? "" : "s"}`,
    collapse: "Collapse",
    hide: "Hide",
    unhide: "Unhide",
    hidden: "Hidden",
    visible: "Visible",
    official: "Staff notice",
    member: "Member note",
    author: "Author",
    createdAt: "Created",
    type: "Type",
    template: "Template",
    page: "Page",
    slot: "Slot",
    positionX: "X",
    positionY: "Y",
    rotationDeg: "Rotation",
    zIndex: "Stack",
    placementMode: "Placement",
    slotFallback: "Slot fallback",
    savePosition: "Save Position",
    savingPosition: "Saving Position",
    positionSaved: "Note position saved.",
    positionSaveError: "Could not save the note position.",
    editContent: "Edit Notice",
    saveContent: "Save Content",
    savingContent: "Saving Content",
    cancel: "Cancel",
    contentSaved: "Staff notice updated.",
    contentSaveError: "Could not update the staff notice.",
    previewPlacementHint: "Tap the board or drag the preview notice to choose where it will be pinned.",
    previewPlacementReady: "The staff notice will be pinned at the selected spot.",
    previewPlacement: "Notice position",
    resetPlacement: "Suggested Spot",
    status: "Status",
    yes: "Yes",
    no: "No",
    unknownAuthor: "Unknown author",
  },
};

function appLanguage(langCd) {
  return langCd === "Eng" ? "en" : "ko";
}

const ROLE_ORDER = ["SUPER_ADMIN", "STAFF", "TEACHER"];

function normalizeRoles(userLike) {
  const roles = Array.isArray(userLike?.roles) && userLike.roles.length > 0
    ? userLike.roles
    : [userLike?.role].filter(Boolean);
  return ROLE_ORDER.filter((role) => roles.includes(role));
}

function hasRole(userLike, role) {
  return normalizeRoles(userLike).includes(role);
}

function dateInputValue(value) {
  return value ? String(value).slice(0, 10) : "";
}

function sanitizeCreatePeriodKey(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

function isValidCreatePeriodKey(value) {
  const normalized = sanitizeCreatePeriodKey(value);
  if (!/^\d{6}$/.test(normalized)) {
    return false;
  }
  const month = Number(normalized.slice(4, 6));
  return month >= 1 && month <= 12;
}

function createPeriodTitleFromKey(value) {
  const normalized = sanitizeCreatePeriodKey(value);
  if (!isValidCreatePeriodKey(normalized)) {
    return "";
  }
  return `Swingpop ${normalized.slice(0, 4)}년 ${normalized.slice(4, 6)}월 보드`;
}

function periodKeyForApi(value) {
  const normalized = sanitizeCreatePeriodKey(value);
  return `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}`;
}

// Once a YYYYMM key is valid, the board almost always runs the whole month, so
// default the range to the first and last day of that month. The admin can
// still override either date afterwards.
function monthRangeFromKey(value) {
  const normalized = sanitizeCreatePeriodKey(value);
  if (!isValidCreatePeriodKey(normalized)) {
    return null;
  }
  const year = Number(normalized.slice(0, 4));
  const month = Number(normalized.slice(4, 6)); // 1-12
  const lastDay = new Date(year, month, 0).getDate(); // day 0 of next month = last day of this one
  const mm = String(month).padStart(2, "0");
  return {
    periodStart: `${normalized.slice(0, 4)}-${mm}-01`,
    periodEnd: `${normalized.slice(0, 4)}-${mm}-${String(lastDay).padStart(2, "0")}`,
  };
}

function seoulTodayKey() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function isArchivePeriod(period, todayKey) {
  return period?.status === "ARCHIVED" || Boolean(period?.periodEnd && period.periodEnd < todayKey);
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

function periodOptionLabel(period) {
  if (!period) {
    return "";
  }
  return `${period.periodKey} · ${period.pageCount} board · ${period.noteCount} note`;
}

function formatAdminDate(value, langCd) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat(langCd === "Eng" ? "en-US" : "ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPeriodDate(value, langCd) {
  if (!value) {
    return "-";
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat(langCd === "Eng" ? "en-US" : "ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function validatePeriodForm(form, labels, { requirePeriodKey = false } = {}) {
  const periodKey = form.periodKey?.trim() || "";
  const title = form.title?.trim() || "";
  const periodStart = form.periodStart || "";
  const periodEnd = form.periodEnd || "";

  if (requirePeriodKey && !isValidCreatePeriodKey(periodKey)) {
    return labels.periodKeyInvalid;
  }
  if (!title) {
    return labels.periodTitleRequired;
  }
  if (!periodStart || !periodEnd) {
    return labels.periodDateRequired;
  }
  if (periodStart >= periodEnd) {
    return labels.periodRangeInvalid;
  }
  return "";
}

function noteAuthor(note, labels) {
  return note?.authorNicknameSnapshot || note?.authorNameSnapshot || labels.unknownAuthor;
}

function sortedNotes(page) {
  return [...(page?.notes || [])].sort((left, right) => (left.slotIndex || 0) - (right.slotIndex || 0));
}

function formatPlacementNumber(value, suffix = "") {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "-";
  }
  return `${Math.round(number * 10) / 10}${suffix}`;
}

function hasFreePlacement(note) {
  return Number.isFinite(Number(note?.positionX)) && Number.isFinite(Number(note?.positionY));
}

function fallbackAdminPlacement(slotIndex) {
  const safeSlot = Math.max(0, Number(slotIndex) || 0);
  return {
    positionX: [13, 38, 63, 87][safeSlot % 4] || 50,
    positionY: [13, 31, 49, 67, 85][Math.floor(safeSlot / 4)] || 50,
    rotationDeg: 0,
  };
}

function notePositionForm(note) {
  const fallback = fallbackAdminPlacement(note?.slotIndex);
  return {
    positionX: String(Number.isFinite(Number(note?.positionX)) ? note.positionX : fallback.positionX),
    positionY: String(Number.isFinite(Number(note?.positionY)) ? note.positionY : fallback.positionY),
    rotationDeg: String(Number.isFinite(Number(note?.rotationDeg)) ? note.rotationDeg : fallback.rotationDeg),
  };
}

const ADMIN_NOTICE_PLACEMENTS = [
  { positionX: 72, positionY: 24, rotationDeg: 2.4 },
  { positionX: 29, positionY: 34, rotationDeg: -2.8 },
  { positionX: 58, positionY: 52, rotationDeg: 1.7 },
  { positionX: 81, positionY: 64, rotationDeg: -1.6 },
  { positionX: 37, positionY: 73, rotationDeg: 2.1 },
  { positionX: 62, positionY: 18, rotationDeg: -2.2 },
];

function suggestedNoticePlacement(page) {
  const noteCount = (page?.notes || []).length;
  const placement = ADMIN_NOTICE_PLACEMENTS[noteCount % ADMIN_NOTICE_PLACEMENTS.length];
  return { ...placement };
}

function roundPlacement(placement) {
  return {
    positionX: Math.round((Number(placement?.positionX) || 0) * 10) / 10,
    positionY: Math.round((Number(placement?.positionY) || 0) * 10) / 10,
    rotationDeg: Math.round((Number(placement?.rotationDeg) || 0) * 10) / 10,
  };
}

function updateManagementNote(management, updatedNote) {
  if (!management || !updatedNote?.id) {
    return management;
  }
  const updateCollection = (collection) => {
    if (!collection?.pages) {
      return collection;
    }
    return {
      ...collection,
      pages: collection.pages.map((page) => ({
        ...page,
        notes: (page.notes || []).map((note) => (note.id === updatedNote.id ? { ...note, ...updatedNote } : note)),
      })),
    };
  };
  return {
    ...management,
    selected: updateCollection(management.selected),
  };
}

function AdminPeriodMetric({ label, value, tone = "default" }) {
  const toneClass = tone === "positive"
    ? "border-swing-sage bg-swing-sage/40 text-swing-teal-deep"
    : tone === "muted"
      ? "border-swing-border/30 bg-swing-cream/50 text-swing-muted"
      : "border-swing-border/30 bg-swing-paper text-swing-ink";

  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClass}`}>
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-swing-muted">{label}</div>
      <div className="mt-1 break-words text-sm font-bold">{value ?? "-"}</div>
    </div>
  );
}

// Period editing and board creation are super-admin actions that are used rarely
// but sat open permanently, pushing the board itself down the page. Collapsed by
// default keeps the panel operations-first; the metrics above stay visible
// because those are the at-a-glance state.
function AdminCollapsible({ title, description, isOpen, onToggle, labels, children }) {
  return (
    <div className="rounded-lg border border-swing-border/30 bg-swing-paper">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-start justify-between gap-3 rounded-lg px-4 py-3 text-left transition hover:bg-swing-cream/50"
      >
        <span className="min-w-0">
          <span className="block text-sm font-bold text-swing-ink">{title}</span>
          {description ? (
            <span className="mt-1 block text-xs leading-5 text-swing-muted">{description}</span>
          ) : null}
        </span>
        <span className="shrink-0 text-xs font-bold text-swing-teal-deep">
          {isOpen ? labels.collapseSection : labels.expandSection}
        </span>
      </button>
      {isOpen ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}

function AdminCorkboardNoteCard({
  note,
  pageNo,
  labels,
  langCd,
  isExpanded,
  isFresh,
  isToggling,
  isSavingPosition,
  isEditingContent,
  isSavingContent,
  onToggleExpand,
  onToggleHidden,
  onUpdatePosition,
  onStartEditContent,
  onCancelEditContent,
  onUpdateContent,
}) {
  const isOfficial = note?.noteType === "OFFICIAL";
  const noteTypeLabel = isOfficial ? labels.official : labels.member;
  const [positionForm, setPositionForm] = useState(() => notePositionForm(note));
  const [contentForm, setContentForm] = useState(note?.content || "");

  useEffect(() => {
    setPositionForm(notePositionForm(note));
  }, [note?.id, note?.positionX, note?.positionY, note?.rotationDeg, note?.slotIndex]);

  useEffect(() => {
    setContentForm(note?.content || "");
  }, [isEditingContent, note?.content, note?.id]);

  const handlePositionChange = (field, value) => {
    setPositionForm((current) => ({ ...current, [field]: value }));
  };

  const handlePositionSubmit = (event) => {
    event.preventDefault();
    onUpdatePosition?.(note, {
      positionX: Number(positionForm.positionX),
      positionY: Number(positionForm.positionY),
      rotationDeg: Number(positionForm.rotationDeg),
    });
  };

  const handleContentSubmit = (event) => {
    event.preventDefault();
    onUpdateContent?.(note, contentForm);
  };

  return (
    <article
      className={[
        "admin-corkboard-note-card",
        note?.hidden ? "is-hidden" : "",
        isFresh ? "is-fresh" : "",
      ].filter(Boolean).join(" ")}
    >
      <div className="admin-corkboard-note-header">
        <div className="admin-corkboard-note-badges">
          <span className={`admin-corkboard-badge ${isOfficial ? "is-official" : "is-member"}`}>
            {noteTypeLabel}
          </span>
          <span className={`admin-corkboard-badge ${note?.hidden ? "is-hidden" : "is-visible"}`}>
            {note?.hidden ? labels.hidden : labels.visible}
          </span>
        </div>
        <span className="admin-corkboard-note-position">
          {labels.page} {pageNo || "-"} · {labels.slot} {(note?.slotIndex ?? 0) + 1}
        </span>
      </div>

      <p className={`admin-corkboard-note-content ${isExpanded ? "is-expanded" : ""}`}>
        {note?.content}
      </p>

      {isOfficial && isEditingContent ? (
        <form className="admin-corkboard-content-form" onSubmit={handleContentSubmit}>
          <textarea
            value={contentForm}
            maxLength={200}
            onChange={(event) => setContentForm(event.target.value.slice(0, 200))}
          />
          <div className="admin-corkboard-content-form-footer">
            <span>{labels.remaining(Math.max(200 - contentForm.length, 0))}</span>
            <div>
              <button type="button" onClick={onCancelEditContent} disabled={isSavingContent}>
                {labels.cancel}
              </button>
              <button type="submit" disabled={isSavingContent}>
                {isSavingContent ? labels.savingContent : labels.saveContent}
              </button>
            </div>
          </div>
        </form>
      ) : null}

      <dl className="admin-corkboard-note-meta">
        <div>
          <dt>{labels.author}</dt>
          <dd>{noteAuthor(note, labels)}</dd>
        </div>
        <div>
          <dt>{labels.createdAt}</dt>
          <dd>{formatAdminDate(note?.createdAt, langCd)}</dd>
        </div>
        <div>
          <dt>{labels.type}</dt>
          <dd>{note?.noteType || "-"}</dd>
        </div>
        <div>
          <dt>{labels.template}</dt>
          <dd>{note?.stickerTemplateKey || "-"}</dd>
        </div>
        <div>
          <dt>{labels.positionX}</dt>
          <dd>{formatPlacementNumber(note?.positionX, "%")}</dd>
        </div>
        <div>
          <dt>{labels.positionY}</dt>
          <dd>{formatPlacementNumber(note?.positionY, "%")}</dd>
        </div>
        <div>
          <dt>{labels.rotationDeg}</dt>
          <dd>{formatPlacementNumber(note?.rotationDeg, "deg")}</dd>
        </div>
        <div>
          <dt>{labels.zIndex}</dt>
          <dd>{Number.isFinite(Number(note?.zIndex)) ? note.zIndex : "-"}</dd>
        </div>
        <div>
          <dt>{labels.placementMode}</dt>
          <dd>{note?.placementMode || (hasFreePlacement(note) ? "FREE" : "SLOT")}</dd>
        </div>
        <div>
          <dt>{labels.slotFallback}</dt>
          <dd>{hasFreePlacement(note) ? labels.no : labels.yes}</dd>
        </div>
      </dl>

      <form className="admin-corkboard-position-form" onSubmit={handlePositionSubmit}>
        <label>
          <span>{labels.positionX}</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={positionForm.positionX}
            onChange={(event) => handlePositionChange("positionX", event.target.value)}
          />
        </label>
        <label>
          <span>{labels.positionY}</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={positionForm.positionY}
            onChange={(event) => handlePositionChange("positionY", event.target.value)}
          />
        </label>
        <label>
          <span>{labels.rotationDeg}</span>
          <input
            type="number"
            min="-6"
            max="6"
            step="0.1"
            value={positionForm.rotationDeg}
            onChange={(event) => handlePositionChange("rotationDeg", event.target.value)}
          />
        </label>
        <button type="submit" disabled={isSavingPosition}>
          {isSavingPosition ? labels.savingPosition : labels.savePosition}
        </button>
      </form>

      <div className="admin-corkboard-note-actions">
        <button type="button" onClick={() => onToggleExpand(note)}>
          {isExpanded ? labels.collapse : labels.view}
        </button>
        {isOfficial && !isEditingContent ? (
          <button type="button" onClick={() => onStartEditContent(note)}>
            {labels.editContent}
          </button>
        ) : null}
        <button
          type="button"
          className={note?.hidden ? "is-unhide" : "is-hide"}
          disabled={isToggling}
          onClick={() => onToggleHidden(note)}
        >
          {note?.hidden ? labels.unhide : labels.hide}
        </button>
      </div>
    </article>
  );
}

function AdminCorkboardNoteGrid({
  page,
  labels,
  langCd,
  expandedNoteId,
  freshNoteId,
  togglingNoteId,
  savingPositionNoteId,
  editingContentNoteId,
  savingContentNoteId,
  onToggleExpand,
  onToggleHidden,
  onUpdatePosition,
  onStartEditContent,
  onCancelEditContent,
  onUpdateContent,
}) {
  const notes = sortedNotes(page);

  if (!notes.length) {
    return <div className="admin-corkboard-empty">{labels.empty}</div>;
  }

  return (
    <div className="admin-corkboard-note-grid">
      {notes.map((note) => (
        <AdminCorkboardNoteCard
          key={note.id}
          note={note}
          pageNo={page?.pageNo}
          labels={labels}
          langCd={langCd}
          isExpanded={expandedNoteId === note.id}
          isFresh={freshNoteId === note.id}
          isToggling={togglingNoteId === note.id}
          isSavingPosition={savingPositionNoteId === note.id}
          isEditingContent={editingContentNoteId === note.id}
          isSavingContent={savingContentNoteId === note.id}
          onToggleExpand={onToggleExpand}
          onToggleHidden={onToggleHidden}
          onUpdatePosition={onUpdatePosition}
          onStartEditContent={onStartEditContent}
          onCancelEditContent={onCancelEditContent}
          onUpdateContent={onUpdateContent}
        />
      ))}
    </div>
  );
}

/**
 * The notes on their own, sized to be read.
 *
 * The management grid answers "where does this note sit and should it stay up",
 * and the board preview answers "what does the wall look like". Neither is a
 * comfortable way to simply read what people wrote, which is the thing staff do
 * most often — so this view drops the coordinates and the controls and keeps the
 * sticker, the words, the author and the date.
 *
 * Read-only on purpose: moderation stays in one place rather than being spread
 * across two screens that would then have to agree with each other.
 */
function AdminCorkboardNoteList({ page, labels, langCd }) {
  const notes = sortedNotes(page);

  if (!notes.length) {
    return <div className="admin-corkboard-empty">{labels.empty}</div>;
  }

  return (
    <div>
      <p className="admin-corkboard-note-list-count">{labels.noteListCount(notes.length)}</p>
      <div className="admin-corkboard-note-list">
        {notes.map((note) => {
          const isOfficial = note?.noteType === "OFFICIAL";

          return (
            <article
              key={note.id}
              className={[
                "admin-corkboard-list-note",
                `corkboard-template-${note?.stickerTemplateKey || "yellow"}`,
                note?.hidden ? "is-hidden" : "",
              ].filter(Boolean).join(" ")}
            >
              <div className="admin-corkboard-list-note-badges">
                <span className={`admin-corkboard-badge ${isOfficial ? "is-official" : "is-member"}`}>
                  {isOfficial ? labels.official : labels.member}
                </span>
                {/* Only when hidden. A "visible" badge on every note would be
                    noise on a screen whose whole point is the writing. */}
                {note?.hidden ? (
                  <span className="admin-corkboard-badge is-hidden">{labels.hidden}</span>
                ) : null}
              </div>

              <p className="admin-corkboard-list-note-content">{note?.content}</p>

              <footer className="admin-corkboard-list-note-footer">
                <span>{noteAuthor(note, labels)}</span>
                <time dateTime={note?.createdAt || undefined}>
                  {formatAdminDate(note?.createdAt, langCd)}
                </time>
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function AdminCorkboardNoticePreview({ note, labels }) {
  return (
    <div className={`admin-corkboard-notice-preview corkboard-template-${note.stickerTemplateKey}`}>
      <span className="admin-corkboard-badge is-official">{labels.official}</span>
      <p>{note.content}</p>
      <div>
        <span>SwingPop</span>
        <span>{note.stickerTemplateKey}</span>
      </div>
    </div>
  );
}

export default function AdminCorkboardPanel({ token, currentUser, langCd = "Kor" }) {
  const labels = COPY[langCd] || COPY.Kor;
  const language = appLanguage(langCd);
  const canManagePeriods = hasRole(currentUser, "SUPER_ADMIN");
  const [management, setManagement] = useState(null);
  const [selectedPeriodKey, setSelectedPeriodKey] = useState("");
  const [activePageIndex, setActivePageIndex] = useState(0);
  // Reading the notes is what opening this screen is usually for, so it lands on
  // the view that just shows them. Moving and moderating are deliberate acts and
  // are one tap away in 관리용 보기.
  const [boardViewMode, setBoardViewMode] = useState("list");
  // Each period form collapses independently; both start collapsed on arrival.
  const [openForms, setOpenForms] = useState({ settings: false, create: false });
  const toggleForm = (key) => setOpenForms((current) => ({ ...current, [key]: !current[key] }));
  // Period actions surface success/error in the banner at the top of the panel;
  // scroll it into view so the feedback isn't missed from the form below.
  const statusRef = useRef(null);
  const scrollToStatus = () => {
    window.setTimeout(() => {
      statusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  };
  const [selectedTemplate, setSelectedTemplate] = useState("official");
  const [content, setContent] = useState("");
  const [noticePlacement, setNoticePlacement] = useState(() => suggestedNoticePlacement(null));
  const [isNoticeDraftDragging, setIsNoticeDraftDragging] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedNoteId, setExpandedNoteId] = useState(null);
  const [freshNoteId, setFreshNoteId] = useState(null);
  const [togglingNoteId, setTogglingNoteId] = useState(null);
  const [savingPositionNoteId, setSavingPositionNoteId] = useState(null);
  const [editingContentNoteId, setEditingContentNoteId] = useState(null);
  const [savingContentNoteId, setSavingContentNoteId] = useState(null);
  const [settingsForm, setSettingsForm] = useState({ title: "", periodStart: "", periodEnd: "" });
  const [createPeriodForm, setCreatePeriodForm] = useState({
    periodKey: "",
    title: "",
    periodStart: "",
    periodEnd: "",
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isCreatingPeriod, setIsCreatingPeriod] = useState(false);
  const [isArchivingPeriod, setIsArchivingPeriod] = useState(false);

  const selected = management?.selected || null;
  const currentPeriod = management?.current || null;
  const periods = management?.periods || [];
  // The board the settings below act on. `current` is whichever period contains
  // today, which is not what the period picker above changes: editing a future
  // month used to write today's board instead, and the server then rejected it
  // for overlapping the month actually being edited. Follow the selection, and
  // fall back to today's board only when nothing is picked. Read from `periods`
  // rather than `selected` because only the summary carries page and note counts.
  const editingPeriod = useMemo(() => {
    const key = selected?.periodKey || currentPeriod?.periodKey;
    return periods.find((period) => period.periodKey === key) || currentPeriod;
  }, [periods, selected?.periodKey, currentPeriod]);
  const todayKey = useMemo(() => seoulTodayKey(), []);
  const archivePeriods = useMemo(
    () => periods.filter((period) => isArchivePeriod(period, todayKey)),
    [periods, todayKey]
  );
  const activePage = selected?.pages?.[activePageIndex] || selected?.pages?.[0] || null;

  const loadCorkboards = useCallback(async (periodKey = "") => {
    if (!token) {
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const nextManagement = await adminApi.findCorkboards(token, periodKey ? { periodKey } : {});
      setManagement(nextManagement);
      setSelectedPeriodKey(nextManagement?.selected?.periodKey || "");
      setActivePageIndex(0);
      setEditingContentNoteId(null);
    } catch (nextError) {
      setError(nextError.message || labels.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [labels.loadError, token]);

  useEffect(() => {
    loadCorkboards();
  }, [loadCorkboards]);

  useEffect(() => {
    if (!editingPeriod) {
      setSettingsForm({ title: "", periodStart: "", periodEnd: "" });
      return;
    }
    setSettingsForm({
      title: editingPeriod.title || "",
      periodStart: dateInputValue(editingPeriod.periodStart),
      periodEnd: dateInputValue(editingPeriod.periodEnd),
    });
  }, [editingPeriod?.periodEnd, editingPeriod?.periodKey, editingPeriod?.periodStart, editingPeriod?.title]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  useEffect(() => {
    if (!selected?.pages?.length) {
      setActivePageIndex(0);
      return;
    }
    if (activePageIndex >= selected.pages.length) {
      setActivePageIndex(0);
    }
  }, [activePageIndex, selected?.pages?.length]);

  useEffect(() => {
    setNoticePlacement(suggestedNoticePlacement(activePage));
    setIsNoticeDraftDragging(false);
  }, [activePage?.id, activePage?.pageNo, selected?.periodKey]);

  const previewNote = useMemo(() => ({
    id: "admin-preview",
    noteType: "OFFICIAL",
    stickerTemplateKey: selectedTemplate,
    content: content.trim() || labels.contentPlaceholder,
    slotIndex: 2,
    positionX: noticePlacement.positionX,
    positionY: noticePlacement.positionY,
    rotationDeg: noticePlacement.rotationDeg,
    zIndex: 90,
    placementMode: "FREE",
    authorNameSnapshot: "SwingPop",
    createdAt: new Date().toISOString(),
  }), [
    content,
    labels.contentPlaceholder,
    noticePlacement.positionX,
    noticePlacement.positionY,
    noticePlacement.rotationDeg,
    selectedTemplate,
  ]);

  const acceptManagementResponse = (nextManagement, preferredPeriodKey) => {
    setManagement(nextManagement);
    setSelectedPeriodKey(nextManagement?.selected?.periodKey || preferredPeriodKey || "");
    setActivePageIndex(0);
  };

  const handleSettingsChange = (field, value) => {
    setSettingsForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreatePeriodChange = (field, value) => {
    if (field === "periodKey") {
      const periodKey = sanitizeCreatePeriodKey(value);
      const range = monthRangeFromKey(periodKey);
      setCreatePeriodForm((current) => ({
        ...current,
        periodKey,
        title: createPeriodTitleFromKey(periodKey),
        // Auto-fill the month range once the key is valid; keep prior dates otherwise.
        ...(range ? { periodStart: range.periodStart, periodEnd: range.periodEnd } : {}),
      }));
      return;
    }
    setCreatePeriodForm((current) => ({ ...current, [field]: value }));
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    if (!canManagePeriods || !editingPeriod?.periodKey) {
      return;
    }

    setError("");
    setNotice("");
    const validationMessage = validatePeriodForm(settingsForm, labels);
    if (validationMessage) {
      setError(validationMessage);
      scrollToStatus();
      return;
    }

    setIsSavingSettings(true);
    try {
      const nextManagement = await adminApi.updateCorkboardPeriod(token, editingPeriod.periodKey, {
        title: settingsForm.title.trim(),
        periodStart: settingsForm.periodStart,
        periodEnd: settingsForm.periodEnd,
      });
      acceptManagementResponse(nextManagement, editingPeriod.periodKey);
      setNotice(labels.settingsSaved);
    } catch (nextError) {
      setError(nextError.message || labels.settingsSaveError);
    } finally {
      setIsSavingSettings(false);
      scrollToStatus();
    }
  };

  const handleCreatePeriod = async (event) => {
    event.preventDefault();
    if (!canManagePeriods) {
      return;
    }

    setError("");
    setNotice("");
    const validationMessage = validatePeriodForm(createPeriodForm, labels, { requirePeriodKey: true });
    if (validationMessage) {
      setError(validationMessage);
      scrollToStatus();
      return;
    }

    const nextPeriodKey = sanitizeCreatePeriodKey(createPeriodForm.periodKey);
    const nextApiPeriodKey = periodKeyForApi(nextPeriodKey);
    const nextTitle = createPeriodTitleFromKey(nextPeriodKey);
    setIsCreatingPeriod(true);
    try {
      const nextManagement = await adminApi.createCorkboardPeriod(token, {
        periodKey: nextApiPeriodKey,
        title: nextTitle,
        periodStart: createPeriodForm.periodStart,
        periodEnd: createPeriodForm.periodEnd,
      });
      acceptManagementResponse(nextManagement, nextApiPeriodKey);
      setCreatePeriodForm({ periodKey: "", title: "", periodStart: "", periodEnd: "" });
      setNotice(labels.periodCreated);
    } catch (nextError) {
      setError(nextError.message || labels.periodCreateError);
    } finally {
      setIsCreatingPeriod(false);
      scrollToStatus();
    }
  };

  const handleArchiveCurrent = async () => {
    if (!canManagePeriods || !editingPeriod?.periodKey || isArchivingPeriod) {
      return;
    }
    // Archives whichever board is on screen, matching the picker. The confirm
    // names the key so it is clear which one is about to become read-only.
    if (!window.confirm(labels.archiveConfirm(editingPeriod.periodKey))) {
      return;
    }

    setError("");
    setNotice("");
    setIsArchivingPeriod(true);
    try {
      const nextManagement = await adminApi.archiveCorkboardPeriod(token, editingPeriod.periodKey);
      acceptManagementResponse(nextManagement, editingPeriod.periodKey);
      setNotice(labels.archiveSaved);
    } catch (nextError) {
      setError(nextError.message || labels.archiveError);
    } finally {
      setIsArchivingPeriod(false);
      scrollToStatus();
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const normalizedContent = content.trim();
    if (!normalizedContent) {
      setError(labels.required);
      return;
    }

    const previousIds = flatNoteIds(selected);
    const placement = roundPlacement(noticePlacement);
    setIsSubmitting(true);
    try {
      const nextManagement = await adminApi.createOfficialCorkboardNote(token, {
        periodKey: selected?.periodKey,
        stickerTemplateKey: selectedTemplate,
        content: normalizedContent,
        positionX: placement.positionX,
        positionY: placement.positionY,
        rotationDeg: placement.rotationDeg,
        pageNo: activePage?.pageNo,
      });
      setManagement(nextManagement);
      setSelectedPeriodKey(nextManagement?.selected?.periodKey || "");
      const newNote = findNewNote(previousIds, nextManagement?.selected);
      if (newNote) {
        setActivePageIndex(newNote.pageIndex);
        setExpandedNoteId(newNote.id);
        setFreshNoteId(newNote.id);
        window.setTimeout(() => setFreshNoteId(null), 1600);
      }
      setContent("");
      setNoticePlacement(suggestedNoticePlacement(nextManagement?.selected?.pages?.[activePageIndex] || activePage));
      setNotice(labels.saved);
    } catch (nextError) {
      setError(nextError.message || labels.saveError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleHidden = async (note) => {
    if (!note?.id) {
      return;
    }
    setTogglingNoteId(note.id);
    setError("");
    setNotice("");
    try {
      await adminApi.updateCorkboardNoteHidden(token, note.id, { hidden: !note.hidden });
      await loadCorkboards(selected?.periodKey || selectedPeriodKey);
      setNotice(labels.hiddenUpdated);
    } catch (nextError) {
      setError(nextError.message || labels.hiddenError);
    } finally {
      setTogglingNoteId(null);
    }
  };

  const handleToggleExpanded = (note) => {
    setExpandedNoteId((currentId) => (currentId === note?.id ? null : note?.id));
  };

  const handleUpdatePosition = async (note, payload) => {
    if (!note?.id || savingPositionNoteId) {
      return;
    }
    setSavingPositionNoteId(note.id);
    setError("");
    setNotice("");
    try {
      const updatedNote = await adminApi.updateCorkboardNotePosition(token, note.id, payload);
      setManagement((current) => updateManagementNote(current, updatedNote));
      setFreshNoteId(note.id);
      window.setTimeout(() => setFreshNoteId(null), 1200);
      setNotice(labels.positionSaved);
    } catch (nextError) {
      setError(nextError.message || labels.positionSaveError);
    } finally {
      setSavingPositionNoteId(null);
    }
  };

  const handleStartEditContent = (note) => {
    if (note?.noteType !== "OFFICIAL") {
      return;
    }
    setError("");
    setNotice("");
    setExpandedNoteId(note.id);
    setEditingContentNoteId(note.id);
  };

  const handleCancelEditContent = () => {
    if (savingContentNoteId) {
      return;
    }
    setEditingContentNoteId(null);
  };

  const handleUpdateContent = async (note, nextContent) => {
    if (!note?.id || note?.noteType !== "OFFICIAL" || savingContentNoteId) {
      return;
    }
    const normalizedContent = nextContent.trim();
    setError("");
    setNotice("");
    if (!normalizedContent) {
      setError(labels.required);
      return;
    }
    if (normalizedContent.length > 200) {
      setError(labels.contentSaveError);
      return;
    }
    setSavingContentNoteId(note.id);
    try {
      const updatedNote = await adminApi.updateCorkboardNoteContent(token, note.id, { content: normalizedContent });
      setManagement((current) => updateManagementNote(current, updatedNote));
      setExpandedNoteId(note.id);
      setFreshNoteId(note.id);
      setEditingContentNoteId(null);
      window.setTimeout(() => setFreshNoteId(null), 1200);
      setNotice(labels.contentSaved);
    } catch (nextError) {
      setError(nextError.message || labels.contentSaveError);
    } finally {
      setSavingContentNoteId(null);
    }
  };

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-swing-teal-deep">Agora</p>
            <h2 className="mt-1 text-2xl font-bold text-swing-ink">{labels.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-swing-muted">{labels.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadCorkboards()}
              className="rounded-full bg-swing-teal-deep px-4 py-2 text-sm font-bold text-swing-paper transition hover:bg-swing-teal"
            >
              {labels.current}
            </button>
            <label className="flex items-center gap-2 text-sm font-bold text-swing-muted">
              {labels.periods}
              <select
                value={selectedPeriodKey}
                onChange={(event) => loadCorkboards(event.target.value)}
                className="rounded-lg border border-swing-border/55 bg-swing-paper px-3 py-2 text-sm font-semibold text-swing-ink"
              >
                {periods.map((period) => (
                  <option key={period.periodKey} value={period.periodKey}>
                    {periodOptionLabel(period)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <div ref={statusRef} aria-hidden="true" className="scroll-mt-4" />
      {notice ? (
        <div className="rounded-lg border border-swing-sage bg-swing-sage/40 px-4 py-3 text-sm font-bold text-swing-teal-deep">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-swing-border/30 pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-swing-teal-deep">
              {labels.boardSettingsTitle}
            </p>
            <h3 className="mt-1 text-xl font-bold text-swing-ink">
              {editingPeriod?.title || labels.noCurrentBoard}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-swing-muted">
              {labels.boardSettingsDescription}
            </p>
          </div>
          {!canManagePeriods ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              {labels.superAdminOnly}
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-bold text-swing-ink">{labels.currentBoardInfo}</h4>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AdminPeriodMetric label={labels.periodKey} value={editingPeriod?.periodKey} />
            <AdminPeriodMetric
              label={labels.periodStart}
              value={formatPeriodDate(editingPeriod?.periodStart, langCd)}
            />
            <AdminPeriodMetric
              label={labels.periodEnd}
              value={formatPeriodDate(editingPeriod?.periodEnd, langCd)}
            />
            <AdminPeriodMetric
              label={labels.status}
              value={editingPeriod?.writable ? labels.writable : labels.notWritable}
              tone={editingPeriod?.writable ? "positive" : "muted"}
            />
            <AdminPeriodMetric label={labels.pageCount} value={editingPeriod?.pageCount ?? 0} />
            <AdminPeriodMetric label={labels.noteCount} value={editingPeriod?.noteCount ?? 0} />
            <AdminPeriodMetric label={labels.periodTitle} value={editingPeriod?.title} />
            <AdminPeriodMetric label={labels.status} value={editingPeriod?.status} />
          </div>
        </div>

        {canManagePeriods ? (
          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <AdminCollapsible
              title={labels.editPeriodTitle}
              description={labels.editPeriodDescription}
              isOpen={openForms.settings}
              onToggle={() => toggleForm("settings")}
              labels={labels}
            >
            <form onSubmit={handleSaveSettings}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-bold text-swing-ink/80 sm:col-span-2">
                  {labels.periodTitle}
                  <input
                    value={settingsForm.title}
                    onChange={(event) => handleSettingsChange("title", event.target.value)}
                    className="rounded-lg border border-swing-border/70 bg-swing-cream px-3 py-2 text-sm font-semibold text-swing-ink outline-none transition focus:border-swing-teal focus:ring-4 focus:ring-swing-teal/40"
                  />
                </label>
                <label className="grid gap-1 text-sm font-bold text-swing-ink/80">
                  {labels.periodStart}
                  <input
                    type="date"
                    value={settingsForm.periodStart}
                    onChange={(event) => handleSettingsChange("periodStart", event.target.value)}
                    className="rounded-lg border border-swing-border/70 bg-swing-cream px-3 py-2 text-sm font-semibold text-swing-ink outline-none transition focus:border-swing-teal focus:ring-4 focus:ring-swing-teal/40"
                  />
                </label>
                <label className="grid gap-1 text-sm font-bold text-swing-ink/80">
                  {labels.periodEnd}
                  <input
                    type="date"
                    value={settingsForm.periodEnd}
                    min={settingsForm.periodStart || undefined}
                    onChange={(event) => handleSettingsChange("periodEnd", event.target.value)}
                    className="rounded-lg border border-swing-border/70 bg-swing-cream px-3 py-2 text-sm font-semibold text-swing-ink outline-none transition focus:border-swing-teal focus:ring-4 focus:ring-swing-teal/40"
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleArchiveCurrent}
                  disabled={!editingPeriod?.periodKey || isArchivingPeriod}
                  className="rounded-lg border border-red-200 bg-swing-paper px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isArchivingPeriod ? labels.archivingCurrent : labels.archiveCurrent}
                </button>
                <button
                  type="submit"
                  disabled={!editingPeriod?.periodKey || isSavingSettings}
                  className="rounded-lg bg-swing-teal-deep px-4 py-2 text-sm font-bold text-swing-paper transition hover:bg-swing-teal disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingSettings ? labels.savingSettings : labels.saveSettings}
                </button>
              </div>
            </form>
            </AdminCollapsible>

            <AdminCollapsible
              title={labels.createPeriodTitle}
              description={labels.createPeriodDescription}
              isOpen={openForms.create}
              onToggle={() => toggleForm("create")}
              labels={labels}
            >
            <form onSubmit={handleCreatePeriod}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-bold text-swing-ink/80">
                  {labels.periodKey}
                  <input
                    value={createPeriodForm.periodKey}
                    onChange={(event) => handleCreatePeriodChange("periodKey", event.target.value)}
                    placeholder="YYYYMM"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    autoComplete="off"
                    className="rounded-lg border border-swing-border/70 bg-swing-cream px-3 py-2 text-sm font-semibold text-swing-ink outline-none transition focus:border-swing-teal focus:ring-4 focus:ring-swing-teal/40"
                  />
                </label>
                <label className="grid gap-1 text-sm font-bold text-swing-ink/80">
                  {labels.periodTitle}
                  <input
                    value={createPeriodForm.title}
                    readOnly
                    className="rounded-lg border border-swing-border/45 bg-swing-cream/70 px-3 py-2 text-sm font-semibold text-swing-ink/80 outline-none"
                  />
                </label>
                <label className="grid gap-1 text-sm font-bold text-swing-ink/80">
                  {labels.periodStart}
                  <input
                    type="date"
                    value={createPeriodForm.periodStart}
                    onChange={(event) => handleCreatePeriodChange("periodStart", event.target.value)}
                    className="rounded-lg border border-swing-border/70 bg-swing-cream px-3 py-2 text-sm font-semibold text-swing-ink outline-none transition focus:border-swing-teal focus:ring-4 focus:ring-swing-teal/40"
                  />
                </label>
                <label className="grid gap-1 text-sm font-bold text-swing-ink/80">
                  {labels.periodEnd}
                  <input
                    type="date"
                    value={createPeriodForm.periodEnd}
                    min={createPeriodForm.periodStart || undefined}
                    onChange={(event) => handleCreatePeriodChange("periodEnd", event.target.value)}
                    className="rounded-lg border border-swing-border/70 bg-swing-cream px-3 py-2 text-sm font-semibold text-swing-ink outline-none transition focus:border-swing-teal focus:ring-4 focus:ring-swing-teal/40"
                  />
                </label>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isCreatingPeriod}
                  className="rounded-lg bg-swing-ink px-4 py-2 text-sm font-bold text-swing-paper transition hover:bg-swing-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingPeriod ? labels.creatingPeriod : labels.createPeriod}
                </button>
              </div>
            </form>
            </AdminCollapsible>
          </div>
        ) : null}

        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-swing-ink">{labels.periodArchiveTitle}</h4>
            <span className="text-xs font-bold text-swing-muted">{archivePeriods.length}</span>
          </div>
          {archivePeriods.length ? (
            <div className="mt-3 grid gap-2">
              {archivePeriods.map((period) => (
                <div
                  key={period.periodKey}
                  className="grid gap-3 rounded-lg border border-swing-border/30 bg-swing-cream/50 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-swing-ink">{period.periodKey}</span>
                      <span className="rounded-full bg-swing-cream/80 px-2 py-0.5 text-[11px] font-bold text-swing-ink/80">
                        {period.status}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold text-swing-ink/80">{period.title}</div>
                    <div className="mt-1 text-xs font-semibold text-swing-muted">
                      {formatPeriodDate(period.periodStart, langCd)} - {formatPeriodDate(period.periodEnd, langCd)}
                      {" · "}
                      {labels.pageCount} {period.pageCount}
                      {" · "}
                      {labels.noteCount} {period.noteCount}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadCorkboards(period.periodKey)}
                    className="rounded-lg border border-swing-border/45 bg-swing-paper px-3 py-2 text-sm font-bold text-swing-ink/80 transition hover:bg-swing-cream/60"
                  >
                    {labels.openPeriod}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-lg bg-swing-cream/50 px-4 py-6 text-center text-sm font-semibold text-swing-muted">
              {labels.periodArchiveEmpty}
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 rounded-lg border border-swing-border/30 bg-swing-paper p-4 shadow-sm">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-swing-ink">{selected?.title || labels.title}</h3>
              <p className="mt-1 text-sm font-semibold text-swing-muted">{selected?.periodKey}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="admin-corkboard-view-toggle" role="tablist" aria-label="Corkboard view mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={boardViewMode === "list"}
                  className={boardViewMode === "list" ? "is-active" : ""}
                  onClick={() => setBoardViewMode("list")}
                >
                  {labels.noteListView}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={boardViewMode === "manage"}
                  className={boardViewMode === "manage" ? "is-active" : ""}
                  onClick={() => setBoardViewMode("manage")}
                >
                  {labels.manageView}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={boardViewMode === "preview"}
                  className={boardViewMode === "preview" ? "is-active" : ""}
                  onClick={() => setBoardViewMode("preview")}
                >
                  {labels.boardPreviewView}
                </button>
              </div>
              {selected?.readOnly ? (
                <span className="w-fit rounded-full bg-swing-ink px-3 py-1 text-xs font-bold text-swing-paper">
                  {labels.readOnly}
                </span>
              ) : null}
            </div>
          </div>

          {selected?.pages?.length > 1 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {selected.pages.map((page, index) => (
                <button
                  key={page.id || page.pageNo}
                  type="button"
                  onClick={() => setActivePageIndex(index)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    index === activePageIndex
                      ? "bg-swing-teal-deep text-swing-paper"
                      : "bg-swing-cream/70 text-swing-muted hover:bg-swing-cream"
                  }`}
                >
                  {labels.board} {page.pageNo}
                </button>
              ))}
            </div>
          ) : null}

          {isLoading && !selected ? (
            <div className="grid min-h-80 place-items-center text-sm font-bold text-swing-muted">{labels.loading}</div>
          ) : boardViewMode === "list" ? (
            <AdminCorkboardNoteList page={activePage} labels={labels} langCd={langCd} />
          ) : boardViewMode === "preview" ? (
            <div className="admin-corkboard-preview-board">
              <CorkboardBoard
                page={activePage}
                language={language}
                activeNoteId={expandedNoteId}
                freshNoteId={freshNoteId}
                draftNote={!selected?.readOnly ? previewNote : null}
                canPlaceNote={!selected?.readOnly && !isSubmitting}
                placementLabel={isNoticeDraftDragging ? labels.previewPlacementReady : labels.previewPlacementHint}
                isDraftDragging={isNoticeDraftDragging}
                onNoteSelect={(note) => setExpandedNoteId((currentId) => (currentId === note.id ? null : note.id))}
                onDraftPlacementChange={(placement) => setNoticePlacement((current) => ({
                  ...current,
                  ...roundPlacement({ ...current, ...placement }),
                }))}
                onDraftDragChange={setIsNoticeDraftDragging}
                emptyLabel={labels.empty}
              />
            </div>
          ) : (
            <AdminCorkboardNoteGrid
              page={activePage}
              labels={labels}
              langCd={langCd}
              expandedNoteId={expandedNoteId}
              freshNoteId={freshNoteId}
              togglingNoteId={togglingNoteId}
              savingPositionNoteId={savingPositionNoteId}
              editingContentNoteId={editingContentNoteId}
              savingContentNoteId={savingContentNoteId}
              onToggleExpand={handleToggleExpanded}
              onToggleHidden={handleToggleHidden}
              onUpdatePosition={handleUpdatePosition}
              onStartEditContent={handleStartEditContent}
              onCancelEditContent={handleCancelEditContent}
              onUpdateContent={handleUpdateContent}
            />
          )}
        </section>

        <aside className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
          {selected?.readOnly ? (
            <div className="rounded-lg bg-swing-cream/50 p-4 text-sm font-semibold text-swing-muted">{labels.readOnly}</div>
          ) : (
            <form onSubmit={handleCreate} className="grid gap-4">
              <div>
                <h3 className="text-lg font-bold text-swing-ink">{labels.createTitle}</h3>
                <p className="mt-1 text-sm leading-6 text-swing-muted">{labels.createDescription}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {OFFICIAL_CORKBOARD_TEMPLATES.map((template) => (
                  <button
                    key={template.key}
                    type="button"
                    onClick={() => setSelectedTemplate(template.key)}
                    className={`corkboard-template-choice corkboard-template-${template.key} ${
                      selectedTemplate === template.key ? "is-active" : ""
                    }`}
                  >
                    {template.name[language]}
                  </button>
                ))}
              </div>

              <div>
                <div className="mb-2 text-xs font-bold text-swing-muted">{labels.preview}</div>
                <AdminCorkboardNoticePreview note={previewNote} labels={labels} />
              </div>

              <div className="admin-corkboard-placement-summary">
                <div>
                  <span>{labels.previewPlacement}</span>
                  <strong>
                    X {formatPlacementNumber(noticePlacement.positionX, "%")} · Y {formatPlacementNumber(noticePlacement.positionY, "%")} · {formatPlacementNumber(noticePlacement.rotationDeg, "deg")}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNoticePlacement(suggestedNoticePlacement(activePage));
                    setBoardViewMode("preview");
                  }}
                >
                  {labels.resetPlacement}
                </button>
              </div>

              <textarea
                value={content}
                maxLength={200}
                onChange={(event) => setContent(event.target.value.slice(0, 200))}
                placeholder={labels.contentPlaceholder}
                className="min-h-32 w-full resize-y rounded-lg border border-swing-border/70 bg-swing-cream px-3 py-2 text-sm leading-6 text-swing-ink outline-none transition focus:border-swing-teal focus:ring-4 focus:ring-swing-teal/40"
              />

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-swing-muted">{labels.remaining(200 - content.length)}</span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-swing-teal-deep px-4 py-2 text-sm font-bold text-swing-paper transition hover:bg-swing-teal disabled:cursor-wait disabled:opacity-60"
                >
                  {isSubmitting ? labels.submitting : labels.submit}
                </button>
              </div>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
