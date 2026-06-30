import React, { useCallback, useEffect, useMemo, useState } from "react";

import { adminApi } from "./api/admin";
import {
  CorkboardBoard,
  CorkboardNoteCard,
  OFFICIAL_CORKBOARD_TEMPLATES,
} from "./CorkboardPage";

const COPY = {
  Kor: {
    title: "Agora Corkboard",
    description: "운영진 공지와 회원 메모가 섞여 보이는 커뮤니티 코르크보드를 관리합니다.",
    current: "현재 보드",
    periods: "기간",
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
  },
  Eng: {
    title: "Agora Corkboard",
    description: "Manage the community corkboard where staff notices and member notes live together.",
    current: "Current board",
    periods: "Periods",
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
  },
};

function appLanguage(langCd) {
  return langCd === "Eng" ? "en" : "ko";
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

export default function AdminCorkboardPanel({ token, langCd = "Kor" }) {
  const labels = COPY[langCd] || COPY.Kor;
  const language = appLanguage(langCd);
  const [management, setManagement] = useState(null);
  const [selectedPeriodKey, setSelectedPeriodKey] = useState("");
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState("official");
  const [content, setContent] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [freshNoteId, setFreshNoteId] = useState(null);
  const [togglingNoteId, setTogglingNoteId] = useState(null);

  const selected = management?.selected || null;
  const periods = management?.periods || [];
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

  const previewNote = useMemo(() => ({
    id: "admin-preview",
    noteType: "OFFICIAL",
    stickerTemplateKey: selectedTemplate,
    content: content.trim() || labels.contentPlaceholder,
    slotIndex: 2,
    authorNameSnapshot: "SwingPop",
    createdAt: new Date().toISOString(),
  }), [content, labels.contentPlaceholder, selectedTemplate]);

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
    setIsSubmitting(true);
    try {
      const nextManagement = await adminApi.createOfficialCorkboardNote(token, {
        periodKey: selected?.periodKey,
        stickerTemplateKey: selectedTemplate,
        content: normalizedContent,
      });
      setManagement(nextManagement);
      setSelectedPeriodKey(nextManagement?.selected?.periodKey || "");
      const newNote = findNewNote(previousIds, nextManagement?.selected);
      if (newNote) {
        setActivePageIndex(newNote.pageIndex);
        setActiveNoteId(newNote.id);
        setFreshNoteId(newNote.id);
        window.setTimeout(() => setFreshNoteId(null), 1600);
      }
      setContent("");
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

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal-700">Agora</p>
            <h2 className="mt-1 text-2xl font-bold text-zinc-950">{labels.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">{labels.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadCorkboards()}
              className="rounded-full bg-teal-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-800"
            >
              {labels.current}
            </button>
            <label className="flex items-center gap-2 text-sm font-bold text-zinc-600">
              {labels.periods}
              <select
                value={selectedPeriodKey}
                onChange={(event) => loadCorkboards(event.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800"
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

      {notice ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-zinc-950">{selected?.title || labels.title}</h3>
              <p className="mt-1 text-sm font-semibold text-zinc-500">{selected?.periodKey}</p>
            </div>
            {selected?.readOnly ? (
              <span className="w-fit rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-white">
                {labels.readOnly}
              </span>
            ) : null}
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
                      ? "bg-teal-700 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {labels.board} {page.pageNo}
                </button>
              ))}
            </div>
          ) : null}

          {isLoading && !selected ? (
            <div className="grid min-h-80 place-items-center text-sm font-bold text-zinc-500">{labels.loading}</div>
          ) : (
            <CorkboardBoard
              page={activePage}
              language={language}
              activeNoteId={activeNoteId}
              freshNoteId={freshNoteId}
              adminControls
              onNoteSelect={(note) => setActiveNoteId((currentId) => (currentId === note.id ? null : note.id))}
              onToggleHidden={togglingNoteId ? undefined : handleToggleHidden}
              emptyLabel={labels.empty}
            />
          )}
        </section>

        <aside className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          {selected?.readOnly ? (
            <div className="rounded-lg bg-zinc-50 p-4 text-sm font-semibold text-zinc-600">{labels.readOnly}</div>
          ) : (
            <form onSubmit={handleCreate} className="grid gap-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-950">{labels.createTitle}</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{labels.createDescription}</p>
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
                <div className="mb-2 text-xs font-bold text-zinc-500">{labels.preview}</div>
                <CorkboardNoteCard note={previewNote} language={language} />
              </div>

              <textarea
                value={content}
                maxLength={200}
                onChange={(event) => setContent(event.target.value.slice(0, 200))}
                placeholder={labels.contentPlaceholder}
                className="min-h-32 w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              />

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-zinc-500">{labels.remaining(200 - content.length)}</span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-teal-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60"
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
