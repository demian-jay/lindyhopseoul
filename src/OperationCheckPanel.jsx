import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { adminApi } from "./api/admin";

const COPY = {
  Kor: {
    quickTitle: "운영 체크",
    quickDescription: "현장에서 바로 남기는 공유 메모와 처리 요청",
    content: "내용",
    contentPlaceholder: "예: 오늘 입장한 John 입장료 확인 필요",
    assignee: "담당자",
    allStaff: "담당자 없음 - 전체 공유",
    save: "저장",
    saving: "저장 중",
    required: "내용을 입력해주세요.",
    saved: "운영 체크가 저장되었습니다.",
    title: "운영 체크 리스트",
    open: "미완료",
    done: "완료",
    all: "전체",
    loading: "불러오는 중",
    emptyOpen: "미완료 항목이 없습니다.",
    emptyDone: "완료된 항목이 없습니다.",
    emptyAll: "등록된 항목이 없습니다.",
    createdBy: "작성자",
    assignedTo: "담당자",
    createdAt: "등록일시",
    status: "상태",
    checkedBy: "완료 처리한 사람",
    checkedMemo: "완료 처리 메모",
    checkedAt: "완료 처리일시",
    detailOpen: "상세 보기",
    detailClose: "접기",
    shared: "전체 운영진",
    comments: "댓글",
    noComments: "등록된 댓글이 없습니다.",
    commentPlaceholder: "질문이나 진행 상황을 남겨주세요.",
    commentRequired: "댓글 내용을 입력해주세요.",
    commentAction: "댓글 달기",
    commentOpenAction: "댓글 보기 / 달기",
    commentToggleOpen: "댓글 보기",
    commentToggleClose: "댓글 접기",
    recentComment: "최근 댓글",
    noCommentSummary: "아직 댓글 없음",
    addComment: "댓글 등록",
    commenting: "등록 중",
    commentSaved: "댓글이 등록되었습니다.",
    edit: "수정",
    update: "수정 저장",
    updating: "저장 중",
    updated: "운영 체크가 수정되었습니다.",
    complete: "완료 처리",
    completeMemo: "완료 처리 메모",
    completeMemoPlaceholder: "처리 내용을 적어주세요. 필요 없으면 비워둘 수 있습니다.",
    confirmComplete: "체크됨",
    cancel: "취소",
    completing: "처리 중",
    completed: "완료 처리되었습니다.",
    statusLabels: {
      OPEN: "미완료",
      DONE: "완료",
    },
  },
  Eng: {
    quickTitle: "Operation Check",
    quickDescription: "Fast shared notes and follow-ups for staff",
    content: "Content",
    contentPlaceholder: "Example: Check John's entrance fee from today",
    assignee: "Assignees",
    allStaff: "No assignee - shared with all staff",
    save: "Save",
    saving: "Saving",
    required: "Please enter content.",
    saved: "Operation check saved.",
    title: "Operation Check List",
    open: "Open",
    done: "Done",
    all: "All",
    loading: "Loading",
    emptyOpen: "No open items.",
    emptyDone: "No completed items.",
    emptyAll: "No items yet.",
    createdBy: "Created by",
    assignedTo: "Assignees",
    createdAt: "Created",
    status: "Status",
    checkedBy: "Completed by",
    checkedMemo: "Completion memo",
    checkedAt: "Completed",
    detailOpen: "Details",
    detailClose: "Collapse",
    shared: "All staff",
    comments: "Comments",
    noComments: "No comments yet.",
    commentPlaceholder: "Add a question or progress update.",
    commentRequired: "Please enter a comment.",
    commentAction: "Comment",
    commentOpenAction: "View / comment",
    commentToggleOpen: "View comments",
    commentToggleClose: "Hide comments",
    recentComment: "Latest",
    noCommentSummary: "No comments yet",
    addComment: "Add comment",
    commenting: "Adding",
    commentSaved: "Comment added.",
    edit: "Edit",
    update: "Save edits",
    updating: "Saving",
    updated: "Operation check updated.",
    complete: "Complete",
    completeMemo: "Completion memo",
    completeMemoPlaceholder: "Add what was handled. You can leave this blank.",
    confirmComplete: "Mark done",
    cancel: "Cancel",
    completing: "Completing",
    completed: "Completed.",
    statusLabels: {
      OPEN: "Open",
      DONE: "Done",
    },
  },
};

function copyFor(langCd) {
  return COPY[langCd] || COPY.Kor;
}

function formatDate(value, langCd) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(langCd === "Eng" ? "en-US" : "ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getAssignees(item) {
  if (item.assignees?.length) {
    return item.assignees;
  }
  if (item.assignedToUserId) {
    return [{ userId: item.assignedToUserId, name: item.assignedToName }];
  }
  return [];
}

function getAssigneeIds(item) {
  return getAssignees(item)
    .map((assignee) => assignee.userId)
    .filter(Boolean);
}

function formatAssigneeSummary(item, labels, langCd) {
  const assignees = getAssignees(item);
  if (assignees.length === 0) {
    return labels.shared;
  }
  if (assignees.length === 1) {
    return assignees[0].name || assignees[0].userId;
  }

  const firstName = assignees[0].name || assignees[0].userId;
  return langCd === "Eng" ? `${firstName} + ${assignees.length - 1}` : `${firstName} 외 ${assignees.length - 1}명`;
}

function formatAssigneeNames(item, labels) {
  const assignees = getAssignees(item);
  if (assignees.length === 0) {
    return labels.shared;
  }
  return assignees.map((assignee) => assignee.name || assignee.userId).join(", ");
}

function formatContentPreview(value) {
  const text = (value || "").replace(/\s+/g, " ").trim();
  if (!text) {
    return "-";
  }
  return text.length > 80 ? `${text.slice(0, 80)}...` : text;
}

function Notice({ type = "error", children }) {
  if (!children) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm leading-6 ${
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {children}
    </div>
  );
}

function StatusBadge({ status, labels }) {
  const isDone = status === "DONE";

  return (
    <span
      className={`inline-flex min-w-[72px] items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        isDone
          ? "border-zinc-200 bg-zinc-100 text-zinc-600"
          : "border-teal-200 bg-teal-50 text-teal-800"
      }`}
    >
      {labels.statusLabels[status] || status}
    </span>
  );
}

function AssigneeMultiSelect({ labels, langCd, assignees, value = [], onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const selectedIds = new Set(value);
  const selectedAssignees = assignees.filter((assignee) => selectedIds.has(assignee.userId));
  const selectedLabel = (() => {
    if (selectedAssignees.length === 0) {
      return labels.allStaff;
    }
    if (selectedAssignees.length <= 2) {
      return selectedAssignees.map((assignee) => assignee.name).join(", ");
    }
    return langCd === "Eng"
      ? `${selectedAssignees[0].name} + ${selectedAssignees.length - 1}`
      : `${selectedAssignees[0].name} 외 ${selectedAssignees.length - 1}명`;
  })();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleMouseDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const toggleAssignee = (userId) => {
    if (disabled) {
      return;
    }
    const nextIds = selectedIds.has(userId)
      ? value.filter((selectedId) => selectedId !== userId)
      : [...value, userId];
    onChange(nextIds);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex min-h-[42px] w-full items-center justify-between gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-left text-sm text-zinc-900 outline-none transition hover:border-teal-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
      >
        <span className="min-w-0 flex-1 truncate font-semibold">{selectedLabel}</span>
        {selectedIds.size > 0 ? (
          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700">
            {selectedIds.size}
          </span>
        ) : null}
        <span className="text-xs font-bold text-zinc-400">{isOpen ? "^" : "v"}</span>
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 z-30 mt-2 max-h-64 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-2 shadow-lg">
          <label className="flex min-h-[36px] cursor-pointer items-center gap-2 rounded-md px-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50">
            <input
              type="checkbox"
              checked={selectedIds.size === 0}
              onChange={() => onChange([])}
              disabled={disabled}
              className="h-4 w-4 rounded border-zinc-300 text-teal-700 focus:ring-teal-600 disabled:cursor-not-allowed"
            />
            <span className="min-w-0 truncate">{labels.allStaff}</span>
          </label>
          {assignees.map((assignee) => (
            <label
              key={assignee.userId}
              className="flex min-h-[36px] cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(assignee.userId)}
                onChange={() => toggleAssignee(assignee.userId)}
                disabled={disabled}
                className="h-4 w-4 rounded border-zinc-300 text-teal-700 focus:ring-teal-600 disabled:cursor-not-allowed"
              />
              <span className="min-w-0 truncate">{assignee.name}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function OperationCheckQuickInput({ token, langCd, onChanged }) {
  const labels = copyFor(langCd);
  const [assignees, setAssignees] = useState([]);
  const [form, setForm] = useState({ content: "", assignedToUserIds: [] });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let isMounted = true;

    adminApi
      .findOperationCheckAssignees(token)
      .then((items) => {
        if (isMounted) {
          setAssignees(items);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAssignees([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleContentChange = (event) => {
    setForm((current) => ({ ...current, content: event.target.value }));
  };

  const handleAssigneesChange = (assignedToUserIds) => {
    setForm((current) => ({ ...current, assignedToUserIds }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const content = form.content.trim();
    if (!content) {
      setError(labels.required);
      return;
    }

    setIsSaving(true);
    try {
      await adminApi.createOperationCheck(token, {
        content,
        assignedToUserIds: form.assignedToUserIds,
      });
      setForm({ content: "", assignedToUserIds: [] });
      setNotice(labels.saved);
      onChanged?.();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-zinc-950">{labels.quickTitle}</h2>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{labels.quickDescription}</p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex min-h-[38px] items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-300"
        >
          {isSaving ? labels.saving : labels.save}
        </button>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_320px]">
        <label className="block">
          <span className="text-xs font-semibold text-zinc-600">{labels.content}</span>
          <textarea
            name="content"
            value={form.content}
            onChange={handleContentChange}
            placeholder={labels.contentPlaceholder}
            rows={2}
            className="mt-1.5 min-h-[64px] w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          />
        </label>
        <div className="block">
          <span className="text-xs font-semibold text-zinc-600">{labels.assignee}</span>
          <div className="mt-1.5">
            <AssigneeMultiSelect
              labels={labels}
              langCd={langCd}
              assignees={assignees}
              value={form.assignedToUserIds}
              onChange={handleAssigneesChange}
              disabled={isSaving}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2" aria-live="polite">
        <Notice>{error}</Notice>
        <Notice type="success">{notice}</Notice>
      </div>
    </form>
  );
}

export default function OperationCheckPanel({ token, langCd, refreshKey = 0, onChanged }) {
  const labels = copyFor(langCd);
  const [status, setStatus] = useState("OPEN");
  const [items, setItems] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [completingItemId, setCompletingItemId] = useState(null);
  const [checkedMemo, setCheckedMemo] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editForm, setEditForm] = useState({ content: "", assignedToUserIds: [] });
  const [isUpdating, setIsUpdating] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentingItemId, setCommentingItemId] = useState(null);
  const [expandedItemIds, setExpandedItemIds] = useState({});
  const [expandedCommentIds, setExpandedCommentIds] = useState({});
  const commentInputRefs = useRef({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const emptyText = useMemo(() => {
    if (status === "DONE") {
      return labels.emptyDone;
    }
    if (status === "ALL") {
      return labels.emptyAll;
    }
    return labels.emptyOpen;
  }, [labels, status]);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setItems(await adminApi.findOperationChecks(token, { status }));
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsLoading(false);
    }
  }, [status, token]);

  useEffect(() => {
    loadItems();
  }, [loadItems, refreshKey]);

  useEffect(() => {
    let isMounted = true;

    adminApi
      .findOperationCheckAssignees(token)
      .then((items) => {
        if (isMounted) {
          setAssignees(items);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAssignees([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const startEdit = (item) => {
    setExpandedItemIds((current) => ({ ...current, [item.id]: true }));
    setEditingItemId(item.id);
    setEditForm({ content: item.content || "", assignedToUserIds: getAssigneeIds(item) });
    setCompletingItemId(null);
    setError("");
    setNotice("");
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditForm({ content: "", assignedToUserIds: [] });
  };

  const submitEdit = async (item) => {
    setError("");
    setNotice("");

    const content = editForm.content.trim();
    if (!content) {
      setError(labels.required);
      return;
    }

    setIsUpdating(true);
    try {
      await adminApi.updateOperationCheck(token, item.id, {
        content,
        assignedToUserIds: editForm.assignedToUserIds,
      });
      setNotice(labels.updated);
      setEditingItemId(null);
      setEditForm({ content: "", assignedToUserIds: [] });
      onChanged?.();
      await loadItems();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const startComplete = (item) => {
    setExpandedItemIds((current) => ({ ...current, [item.id]: true }));
    setCompletingItemId(item.id);
    setEditingItemId(null);
    setCheckedMemo("");
    setError("");
    setNotice("");
  };

  const cancelComplete = () => {
    setCompletingItemId(null);
    setCheckedMemo("");
  };

  const submitComplete = async (item) => {
    setError("");
    setNotice("");
    setIsCompleting(true);

    try {
      await adminApi.completeOperationCheck(token, item.id, {
        checkedMemo: checkedMemo.trim() || null,
      });
      setNotice(labels.completed);
      setCompletingItemId(null);
      setCheckedMemo("");
      onChanged?.();
      await loadItems();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsCompleting(false);
    }
  };

  const updateCommentDraft = (itemId, value) => {
    setCommentDrafts((current) => ({ ...current, [itemId]: value }));
  };

  const toggleItem = (itemId) => {
    const shouldOpen = !(expandedItemIds[itemId] || expandedCommentIds[itemId]);
    setExpandedItemIds((current) => ({ ...current, [itemId]: shouldOpen }));
    if (!shouldOpen) {
      setExpandedCommentIds((current) => ({ ...current, [itemId]: false }));
    }
  };

  const toggleComments = (itemId) => {
    setExpandedItemIds((current) => ({ ...current, [itemId]: true }));
    setExpandedCommentIds((current) => ({ ...current, [itemId]: !current[itemId] }));
  };

  const openComments = (itemId, shouldFocus = false) => {
    setExpandedItemIds((current) => ({ ...current, [itemId]: true }));
    setExpandedCommentIds((current) => ({ ...current, [itemId]: true }));
    if (shouldFocus) {
      window.setTimeout(() => {
        commentInputRefs.current[itemId]?.focus();
      }, 0);
    }
  };

  const submitComment = async (item) => {
    setError("");
    setNotice("");

    const content = (commentDrafts[item.id] || "").trim();
    if (!content) {
      setError(labels.commentRequired);
      return;
    }

    setCommentingItemId(item.id);
    try {
      await adminApi.createOperationCheckComment(token, item.id, { content });
      setCommentDrafts((current) => ({ ...current, [item.id]: "" }));
      setExpandedCommentIds((current) => ({ ...current, [item.id]: true }));
      setNotice(labels.commentSaved);
      await loadItems();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setCommentingItemId(null);
    }
  };

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">{labels.title}</h2>
          <p className="mt-1 text-sm text-zinc-500">{isLoading ? labels.loading : `${items.length}`}</p>
        </div>
        <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-1">
          {[
            ["OPEN", labels.open],
            ["DONE", labels.done],
            ["ALL", labels.all],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={`min-h-[32px] rounded-md px-3 text-xs font-semibold transition ${
                status === value ? "bg-white text-teal-700 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-2" aria-live="polite">
        <Notice>{error}</Notice>
        <Notice type="success">{notice}</Notice>
      </div>

      <div className="mt-4 grid gap-3">
        {!isLoading && items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
            {emptyText}
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className="operation-check-grid-header rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-500">
            <span>{labels.status}</span>
            <span>{labels.createdBy}</span>
            <span>{labels.assignedTo}</span>
            <span>{labels.content}</span>
            <span className="text-center">{labels.comments}</span>
            <span className="text-center">{labels.detailOpen}</span>
          </div>
        ) : null}

        {items.map((item) => {
          const comments = item.comments || [];
          const isEditing = editingItemId === item.id;
          const commentCount = item.commentCount ?? comments.length;
          const isCommentsOpen = expandedCommentIds[item.id] === true;
          const isItemExpanded =
            expandedItemIds[item.id] === true || isEditing || completingItemId === item.id || isCommentsOpen;
          const latestComment = comments[comments.length - 1];

          return (
            <article key={item.id} className="overflow-hidden rounded-lg border border-zinc-200">
              <div className="operation-check-grid-row">
                <div className="operation-check-status-cell operation-check-summary-pair">
                  <span className="operation-check-mobile-label">{labels.status}</span>
                  <StatusBadge status={item.status} labels={labels} />
                </div>
                <div className="operation-check-creator-cell operation-check-summary-cell">
                  <div className="operation-check-mobile-label">{labels.createdBy}</div>
                  <div className="truncate font-semibold text-zinc-900">{item.createdByName || "-"}</div>
                </div>
                <div className="operation-check-assignee-cell operation-check-summary-cell">
                  <div className="operation-check-mobile-label">{labels.assignedTo}</div>
                  <div className="truncate font-semibold text-zinc-700">{formatAssigneeSummary(item, labels, langCd)}</div>
                </div>
                <div className="operation-check-content-cell operation-check-summary-cell">
                  <div className="operation-check-mobile-label">{labels.content}</div>
                  <div className="truncate text-zinc-800">{formatContentPreview(item.content)}</div>
                </div>
                <div className="operation-check-summary-pair operation-check-comment-cell">
                  <span className="operation-check-mobile-label">{labels.comments}</span>
                  <span className="inline-flex min-h-[24px] items-center rounded-full bg-zinc-50 px-2 text-xs font-bold text-zinc-700">
                    {commentCount}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isItemExpanded}
                  className={`operation-check-grid-detail-button inline-flex min-h-[34px] items-center justify-center rounded-md px-2.5 py-2 text-xs font-semibold transition ${
                    isItemExpanded
                      ? "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                      : "bg-teal-700 text-white hover:bg-teal-800"
                  }`}
                >
                  {isItemExpanded ? labels.detailClose : labels.detailOpen}
                </button>
              </div>

              {isItemExpanded ? (
                <div className="border-t border-zinc-100 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="w-full min-w-0 sm:flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} labels={labels} />
                    <span className="order-3 w-full text-xs font-semibold text-zinc-500 sm:order-none sm:w-auto">
                      {formatDate(item.createdAt, langCd)}
                    </span>
                    <span className="inline-flex min-h-[24px] max-w-full items-center rounded-full border border-teal-100 bg-teal-50 px-2 text-xs font-semibold text-teal-800">
                      {formatAssigneeSummary(item, labels, langCd)}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="mt-3 grid gap-3 border-t border-zinc-100 pt-3">
                      <label className="block">
                        <span className="text-xs font-semibold text-zinc-600">{labels.content}</span>
                        <textarea
                          value={editForm.content}
                          onChange={(event) =>
                            setEditForm((current) => ({ ...current, content: event.target.value }))
                          }
                          rows={3}
                          className="mt-1.5 min-h-[88px] w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        />
                      </label>
                      <div className="block">
                        <span className="text-xs font-semibold text-zinc-600">{labels.assignee}</span>
                        <div className="mt-1.5">
                          <AssigneeMultiSelect
                            labels={labels}
                            langCd={langCd}
                            assignees={assignees}
                            value={editForm.assignedToUserIds}
                            onChange={(assignedToUserIds) =>
                              setEditForm((current) => ({ ...current, assignedToUserIds }))
                            }
                            disabled={isUpdating}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-900">{item.content}</p>
                  )}
                </div>

                <div className="flex w-full gap-2 sm:w-auto sm:flex-wrap sm:justify-end">
                  {item.canEdit && !isEditing ? (
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="inline-flex min-h-[38px] flex-1 items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 sm:flex-none"
                    >
                      {labels.edit}
                    </button>
                  ) : null}
                  {item.canComplete && !isEditing ? (
                    <button
                      type="button"
                      onClick={() => startComplete(item)}
                      className="inline-flex min-h-[38px] flex-1 items-center justify-center rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 transition hover:bg-teal-100 sm:flex-none"
                    >
                      {labels.complete}
                    </button>
                  ) : null}
                </div>
              </div>

              {isEditing ? (
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={isUpdating}
                    className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-300"
                  >
                    {labels.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={() => submitEdit(item)}
                    disabled={isUpdating}
                    className="inline-flex min-h-[36px] items-center justify-center rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-300"
                  >
                    {isUpdating ? labels.updating : labels.update}
                  </button>
                </div>
              ) : null}

              {item.canComplete && completingItemId === item.id ? (
                <div className="mt-4 border-t border-teal-100 bg-teal-50/60 p-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-teal-900">{labels.completeMemo}</span>
                    <textarea
                      value={checkedMemo}
                      onChange={(event) => setCheckedMemo(event.target.value)}
                      placeholder={labels.completeMemoPlaceholder}
                      rows={2}
                      className="mt-1.5 min-h-[64px] w-full resize-y rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelComplete}
                      disabled={isCompleting}
                      className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-300"
                    >
                      {labels.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={() => submitComplete(item)}
                      disabled={isCompleting}
                      className="inline-flex min-h-[36px] items-center justify-center rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-300"
                    >
                      {isCompleting ? labels.completing : labels.confirmComplete}
                    </button>
                  </div>
                </div>
              ) : null}

              <dl className="mt-4 grid gap-3 border-t border-zinc-100 pt-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <dt className="text-xs font-semibold text-zinc-500">{labels.createdBy}</dt>
                  <dd className="mt-1 font-semibold text-zinc-900">{item.createdByName || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-zinc-500">{labels.assignedTo}</dt>
                  <dd className="mt-1 font-semibold text-zinc-900">{formatAssigneeNames(item, labels)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-zinc-500">{labels.createdAt}</dt>
                  <dd className="mt-1 text-zinc-700">{formatDate(item.createdAt, langCd)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-zinc-500">{labels.status}</dt>
                  <dd className="mt-1 text-zinc-700">{labels.statusLabels[item.status] || item.status}</dd>
                </div>
                {item.status === "DONE" ? (
                  <>
                    <div>
                      <dt className="text-xs font-semibold text-zinc-500">{labels.checkedBy}</dt>
                      <dd className="mt-1 font-semibold text-zinc-900">{item.checkedByName || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-zinc-500">{labels.checkedMemo}</dt>
                      <dd className="mt-1 whitespace-pre-wrap text-zinc-700">{item.checkedMemo || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-zinc-500">{labels.checkedAt}</dt>
                      <dd className="mt-1 text-zinc-700">{formatDate(item.checkedAt, langCd)}</dd>
                    </div>
                  </>
                ) : null}
              </dl>

              <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => toggleComments(item.id)}
                    aria-expanded={isCommentsOpen}
                    className="flex min-h-[32px] w-full min-w-0 items-center gap-2 text-left text-sm text-zinc-700 transition hover:text-zinc-950 sm:flex-1"
                  >
                    <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-bold text-zinc-700">
                      {labels.comments} {commentCount}
                    </span>
                    <span className="min-w-0 truncate">
                      {latestComment
                        ? `${labels.recentComment}: ${latestComment.createdByName || "-"} - ${latestComment.content}`
                        : labels.noCommentSummary}
                    </span>
                  </button>
                  <div className="grid gap-2 sm:flex sm:shrink-0 sm:items-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (isCommentsOpen) {
                          toggleComments(item.id);
                        } else {
                          openComments(item.id, true);
                        }
                      }}
                      className={`inline-flex min-h-[36px] w-full items-center justify-center rounded-md px-2.5 py-2 text-xs font-semibold transition sm:w-auto ${
                        isCommentsOpen
                          ? "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                          : "bg-teal-700 text-white hover:bg-teal-800"
                      }`}
                    >
                      {isCommentsOpen ? labels.commentToggleClose : labels.commentOpenAction}
                    </button>
                  </div>
                </div>
              </div>

              {isCommentsOpen ? (
                <section className="mt-3 border-t border-zinc-100 pt-4">
                  <div className="grid gap-3">
                    {comments.length === 0 ? (
                      <p className="rounded-lg bg-zinc-50 px-3 py-3 text-sm text-zinc-500">{labels.noComments}</p>
                    ) : (
                      comments.map((comment) => (
                        <div
                          key={comment.id || `${item.id}-${comment.createdAt}`}
                          className="border-l-2 border-zinc-200 pl-3"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-zinc-900">{comment.createdByName || "-"}</span>
                            <span className="text-xs font-semibold text-zinc-400">
                              {formatDate(comment.createdAt, langCd)}
                            </span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{comment.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-3 grid gap-2">
                    <textarea
                      ref={(element) => {
                        if (element) {
                          commentInputRefs.current[item.id] = element;
                        } else {
                          delete commentInputRefs.current[item.id];
                        }
                      }}
                      value={commentDrafts[item.id] || ""}
                      onChange={(event) => updateCommentDraft(item.id, event.target.value)}
                      placeholder={labels.commentPlaceholder}
                      rows={2}
                      className="min-h-[64px] w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => submitComment(item)}
                        disabled={commentingItemId === item.id}
                        className="inline-flex min-h-[40px] w-full items-center justify-center rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-300 sm:w-auto"
                      >
                        {commentingItemId === item.id ? labels.commenting : labels.addComment}
                      </button>
                    </div>
                  </div>
                </section>
              ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
