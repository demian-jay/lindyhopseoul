import React, { useCallback, useEffect, useMemo, useState } from "react";

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
    writeSubtitle: "템플릿을 고르고, 짧게 남기면 보드에 살짝 붙습니다.",
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
    writeSubtitle: "Pick a note style, write a short message, and watch it land on the board.",
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

function noteStyle(slotIndex) {
  return {
    "--note-rotate": `${NOTE_ROTATIONS[slotIndex % NOTE_ROTATIONS.length]}deg`,
    "--note-shift-x": `${NOTE_X[slotIndex % NOTE_X.length]}px`,
    "--note-shift-y": `${NOTE_Y[slotIndex % NOTE_Y.length]}px`,
    "--note-delay": `${(slotIndex % 6) * 35}ms`,
  };
}

export function CorkboardNoteCard({
  note,
  language = "ko",
  isSelected = false,
  isFresh = false,
  adminControls = false,
  onSelect,
  onToggleHidden,
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
      style={noteStyle(note.slotIndex || 0)}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => onSelect?.(note)}
      onKeyDown={handleKeyDown}
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
  onNoteSelect,
  onToggleHidden,
  emptyLabel,
}) {
  const notesBySlot = useMemo(() => {
    const map = new Map();
    (page?.notes || []).forEach((note) => {
      map.set(Number(note.slotIndex) || 0, note);
    });
    return map;
  }, [page]);

  const hasNotes = notesBySlot.size > 0;

  return (
    <section className="corkboard-stage" aria-label={page?.title || "Agora Corkboard"}>
      <div className="corkboard-slots">
        {Array.from({ length: 18 }).map((_, slotIndex) => {
          const note = notesBySlot.get(slotIndex);
          return (
            <div key={slotIndex} className="corkboard-slot">
              {note ? (
                <CorkboardNoteCard
                  note={note}
                  language={language}
                  isSelected={activeNoteId === note.id}
                  isFresh={freshNoteId === note.id}
                  adminControls={adminControls}
                  onSelect={onNoteSelect}
                  onToggleHidden={onToggleHidden}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      {!hasNotes ? <div className="corkboard-empty">{emptyLabel}</div> : null}
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
      setActivePageIndex(0);
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
  const remaining = 200 - content.length;
  const previewNote = useMemo(() => ({
    id: "preview",
    noteType: "MEMBER",
    stickerTemplateKey: selectedTemplate,
    content: content.trim() || labels.placeholder,
    slotIndex: 1,
    authorNicknameSnapshot: authState?.nickname || authState?.displayName || labels.friend,
    authorNameSnapshot: authState?.displayName || labels.friend,
    createdAt: new Date().toISOString(),
  }), [authState?.displayName, authState?.nickname, content, labels.friend, labels.placeholder, selectedTemplate]);

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
      setNotice(labels.saved);
      loadArchivePeriods().catch(() => null);
    } catch (nextError) {
      setError(nextError.message || labels.saveError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="corkboard-page">
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
              onNoteSelect={(note) => setActiveNoteId((currentId) => (currentId === note.id ? null : note.id))}
              emptyLabel={labels.emptyBoard}
            />
          )}
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
