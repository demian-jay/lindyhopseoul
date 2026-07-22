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
    mineTitle: "내 운영 체크",
    mineEmpty: "최근 확인내용이 없습니다.",
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
    close: "닫기",
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
    mineTitle: "My Operation Checks",
    mineEmpty: "Nothing to check right now.",
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
    close: "Close",
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
          ? "border-swing-sage bg-swing-sage/40 text-swing-teal-deep"
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
          ? "border-swing-border/30 bg-swing-cream/70 text-swing-muted"
          : "border-swing-teal/30 bg-swing-teal/10 text-swing-teal-deep"
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
        className="flex min-h-[42px] w-full items-center justify-between gap-2 rounded-lg border border-swing-border/70 bg-swing-cream px-3 text-left text-sm text-swing-ink outline-none transition hover:border-swing-teal/60 focus:border-swing-teal focus:ring-2 focus:ring-swing-teal/40 disabled:cursor-not-allowed disabled:bg-swing-paper disabled:text-swing-muted"
      >
        <span className="min-w-0 flex-1 truncate font-semibold">{selectedLabel}</span>
        {selectedIds.size > 0 ? (
          <span className="rounded-full bg-swing-teal/10 px-2 py-0.5 text-xs font-bold text-swing-teal-deep">
            {selectedIds.size}
          </span>
        ) : null}
        <span className="text-xs font-bold text-swing-muted/70">{isOpen ? "^" : "v"}</span>
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 z-30 mt-2 max-h-64 overflow-y-auto rounded-lg border border-swing-border/30 bg-swing-paper p-2 shadow-lg">
          <label className="flex min-h-[36px] cursor-pointer items-center gap-2 rounded-md px-2 text-sm font-semibold text-swing-ink transition hover:bg-swing-cream/50">
            <input
              type="checkbox"
              checked={selectedIds.size === 0}
              onChange={() => onChange([])}
              disabled={disabled}
              className="h-4 w-4 rounded border-swing-border/60 text-swing-teal-deep focus:ring-swing-teal disabled:cursor-not-allowed"
            />
            <span className="min-w-0 truncate">{labels.allStaff}</span>
          </label>
          {assignees.map((assignee) => (
            <label
              key={assignee.userId}
              className="flex min-h-[36px] cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-swing-ink/80 transition hover:bg-swing-cream/50"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(assignee.userId)}
                onChange={() => toggleAssignee(assignee.userId)}
                disabled={disabled}
                className="h-4 w-4 rounded border-swing-border/60 text-swing-teal-deep focus:ring-swing-teal disabled:cursor-not-allowed"
              />
              <span className="min-w-0 truncate">{assignee.name}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// "Related to me" is anything I would be expected to act on: items I raised,
// items assigned to me, and items shared with everyone — an unassigned item is
// the whole staff's to pick up, so it counts.
function isRelatedToUser(item, userId) {
  if (!userId) {
    return false;
  }
  if (item.createdByUserId === userId) {
    return true;
  }
  const assignees = getAssignees(item);
  if (assignees.length === 0) {
    return true;
  }
  return assignees.some((assignee) => assignee.userId === userId);
}

/**
 * One item, one modal. The dashboard list is a to-do list, so a tap should open
 * exactly what is needed to finish that single item — the content, who it is
 * for, and the completion action — and nothing else. Everything richer (edit,
 * comments, history) stays on the OPERATION_CHECK menu.
 */
function OperationCheckMineModal({ token, langCd, item, onClose, onCompleted }) {
  const labels = copyFor(langCd);
  const [checkedMemo, setCheckedMemo] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleComplete = async () => {
    setError("");
    setIsCompleting(true);

    try {
      await adminApi.completeOperationCheck(token, item.id, {
        checkedMemo: checkedMemo.trim() || null,
      });
      onCompleted(item);
    } catch (nextError) {
      setError(nextError.message);
      setIsCompleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-swing-ink/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-lg">
        <p className="text-xs font-semibold text-swing-muted">
          {formatAssigneeSummary(item, labels, langCd)} · {formatDate(item.createdAt, langCd)}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-swing-ink">{item.content}</p>

        {item.canComplete ? (
          <textarea
            value={checkedMemo}
            onChange={(event) => setCheckedMemo(event.target.value)}
            placeholder={labels.completeMemoPlaceholder}
            rows={2}
            disabled={isCompleting}
            className="mt-4 min-h-[64px] w-full resize-y rounded-lg border border-swing-border/70 bg-swing-cream px-3 py-2 text-sm leading-6 text-swing-ink outline-none transition placeholder:text-swing-muted focus:border-swing-teal focus:ring-2 focus:ring-swing-teal/40"
          />
        ) : null}

        <div className="mt-3 grid gap-2" aria-live="polite">
          <Notice>{error}</Notice>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isCompleting}
            className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-swing-border/55 bg-swing-paper px-3 text-xs font-semibold text-swing-ink/80 transition hover:bg-swing-cream/50 disabled:cursor-not-allowed disabled:text-swing-muted/45"
          >
            {labels.close}
          </button>
          {item.canComplete ? (
            <button
              type="button"
              onClick={handleComplete}
              disabled={isCompleting}
              className="inline-flex min-h-[38px] items-center justify-center rounded-lg bg-swing-teal-deep px-4 text-xs font-semibold text-swing-paper transition hover:bg-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70"
            >
              {isCompleting ? labels.completing : labels.confirmComplete}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard companion to the quick input above it. The OPERATION_CHECK menu
 * shows everything; this shows only what the signed-in account is on the hook
 * for, and shrinks to a single line of text when that is nothing — a dashboard
 * should not spend a card on "there is nothing here".
 */
export function OperationCheckMineList({ token, langCd, currentUserId, refreshKey = 0, onChanged }) {
  const labels = copyFor(langCd);
  const [items, setItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const selectedItem = items.find((item) => item.id === selectedItemId) || null;

  useEffect(() => {
    let isMounted = true;

    adminApi
      .findOperationChecks(token, { status: "OPEN" })
      .then((list) => {
        if (isMounted) {
          setItems((list || []).filter((item) => isRelatedToUser(item, currentUserId)));
        }
      })
      .catch(() => {
        if (isMounted) {
          setItems([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token, currentUserId, refreshKey]);

  // Nothing at all until the first response, so the empty line does not flash
  // before the list arrives.
  if (!isLoaded) {
    return null;
  }

  // Owns its divider rather than the card doing it, so nothing is drawn while
  // the first response is still in flight.
  if (items.length === 0) {
    return (
      <div className="mt-4 border-t border-swing-border/30 pt-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-swing-muted">{labels.mineTitle}</h3>
        </div>
        <p className="mt-2 rounded-lg border border-dashed border-swing-border/40 px-3 py-3 text-center text-xs text-swing-muted/80">
          {labels.mineEmpty}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-swing-border/30 pt-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold text-swing-muted">{labels.mineTitle}</h3>
        <span className="text-xs font-semibold text-swing-muted">{items.length}</span>
      </div>
      <ul className="mt-2 grid gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setSelectedItemId(item.id)}
              className="flex w-full flex-col gap-1 rounded-lg border border-swing-border/30 px-3 py-2 text-left transition hover:bg-swing-cream/50"
            >
              <span className="text-sm leading-5 text-swing-ink">{formatContentPreview(item.content)}</span>
              <span className="text-[11px] text-swing-muted">
                {formatAssigneeSummary(item, labels, langCd)} · {formatDate(item.createdAt, langCd)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {selectedItem ? (
        <OperationCheckMineModal
          token={token}
          langCd={langCd}
          item={selectedItem}
          onClose={() => setSelectedItemId(null)}
          onCompleted={(completedItem) => {
            // Drop it here right away — the list only ever shows OPEN items, so
            // waiting for a reload would leave a done item on screen.
            setItems((current) => current.filter((item) => item.id !== completedItem.id));
            setSelectedItemId(null);
            onChanged?.();
          }}
        />
      ) : null}
    </div>
  );
}

// `children` is a slot at the foot of the card, used by the dashboard to hang
// OperationCheckMineList off the same card the quick input lives in — an empty
// list reads as empty only when it sits where the list would have been.
export function OperationCheckQuickInput({ token, langCd, onChanged, children }) {
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
    <form onSubmit={handleSubmit} className="rounded-lg border border-swing-border/30 bg-swing-paper p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-swing-ink">{labels.quickTitle}</h2>
          <p className="mt-1 text-xs leading-5 text-swing-muted">{labels.quickDescription}</p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex min-h-[38px] items-center justify-center rounded-lg bg-swing-teal-deep px-4 text-sm font-semibold text-swing-paper transition hover:bg-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70"
        >
          {isSaving ? labels.saving : labels.save}
        </button>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_320px]">
        <label className="block">
          <span className="text-xs font-semibold text-swing-muted">{labels.content}</span>
          <textarea
            name="content"
            value={form.content}
            onChange={handleContentChange}
            placeholder={labels.contentPlaceholder}
            rows={2}
            className="mt-1.5 min-h-[64px] w-full resize-y rounded-lg border border-swing-border/70 bg-swing-cream px-3 py-2 text-sm leading-6 text-swing-ink outline-none transition placeholder:text-swing-muted focus:border-swing-teal focus:ring-2 focus:ring-swing-teal/40"
          />
        </label>
        <div className="block">
          <span className="text-xs font-semibold text-swing-muted">{labels.assignee}</span>
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
      {children}
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
    <section className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-swing-border/30 pb-4">
        <div>
          <h2 className="text-lg font-bold text-swing-ink">{labels.title}</h2>
          <p className="mt-1 text-sm text-swing-muted">{isLoading ? labels.loading : `${items.length}`}</p>
        </div>
        <div className="flex rounded-lg border border-swing-border/30 bg-swing-cream/50 p-1">
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
                status === value ? "bg-swing-paper text-swing-teal-deep shadow-sm" : "text-swing-muted hover:text-swing-ink"
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
          <div className="rounded-lg border border-dashed border-swing-border/45 bg-swing-cream/50 p-8 text-center text-sm text-swing-muted">
            {emptyText}
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className="operation-check-grid-header rounded-lg border border-swing-border/30 bg-swing-cream/50 px-3 py-2 text-xs font-bold text-swing-muted">
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
            <article key={item.id} className="overflow-hidden rounded-lg border border-swing-border/30">
              <div className="operation-check-grid-row">
                <div className="operation-check-status-cell operation-check-summary-pair">
                  <span className="operation-check-mobile-label">{labels.status}</span>
                  <StatusBadge status={item.status} labels={labels} />
                </div>
                <div className="operation-check-creator-cell operation-check-summary-cell">
                  <div className="operation-check-mobile-label">{labels.createdBy}</div>
                  <div className="truncate font-semibold text-swing-ink">{item.createdByName || "-"}</div>
                </div>
                <div className="operation-check-assignee-cell operation-check-summary-cell">
                  <div className="operation-check-mobile-label">{labels.assignedTo}</div>
                  <div className="truncate font-semibold text-swing-ink/80">{formatAssigneeSummary(item, labels, langCd)}</div>
                </div>
                <div className="operation-check-content-cell operation-check-summary-cell">
                  <div className="operation-check-mobile-label">{labels.content}</div>
                  <div className="truncate text-swing-ink">{formatContentPreview(item.content)}</div>
                </div>
                <div className="operation-check-summary-pair operation-check-comment-cell">
                  <span className="operation-check-mobile-label">{labels.comments}</span>
                  <span className="inline-flex min-h-[24px] items-center rounded-full bg-swing-cream/50 px-2 text-xs font-bold text-swing-ink/80">
                    {commentCount}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isItemExpanded}
                  className={`operation-check-grid-detail-button inline-flex min-h-[34px] items-center justify-center rounded-md px-2.5 py-2 text-xs font-semibold transition ${
                    isItemExpanded
                      ? "border border-swing-border/45 bg-swing-paper text-swing-ink/80 hover:bg-swing-cream/50"
                      : "bg-swing-teal-deep text-swing-paper hover:bg-swing-teal"
                  }`}
                >
                  {isItemExpanded ? labels.detailClose : labels.detailOpen}
                </button>
              </div>

              {isItemExpanded ? (
                <div className="border-t border-swing-border/20 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="w-full min-w-0 sm:flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} labels={labels} />
                    <span className="order-3 w-full text-xs font-semibold text-swing-muted sm:order-none sm:w-auto">
                      {formatDate(item.createdAt, langCd)}
                    </span>
                    <span className="inline-flex min-h-[24px] max-w-full items-center rounded-full border border-swing-teal/20 bg-swing-teal/10 px-2 text-xs font-semibold text-swing-teal-deep">
                      {formatAssigneeSummary(item, labels, langCd)}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="mt-3 grid gap-3 border-t border-swing-border/20 pt-3">
                      <label className="block">
                        <span className="text-xs font-semibold text-swing-muted">{labels.content}</span>
                        <textarea
                          value={editForm.content}
                          onChange={(event) =>
                            setEditForm((current) => ({ ...current, content: event.target.value }))
                          }
                          rows={3}
                          className="mt-1.5 min-h-[88px] w-full resize-y rounded-lg border border-swing-border/70 bg-swing-cream px-3 py-2 text-sm leading-6 text-swing-ink outline-none transition placeholder:text-swing-muted focus:border-swing-teal focus:ring-2 focus:ring-swing-teal/40"
                        />
                      </label>
                      <div className="block">
                        <span className="text-xs font-semibold text-swing-muted">{labels.assignee}</span>
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
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-swing-ink">{item.content}</p>
                  )}
                </div>

                <div className="flex w-full gap-2 sm:w-auto sm:flex-wrap sm:justify-end">
                  {item.canEdit && !isEditing ? (
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="inline-flex min-h-[38px] flex-1 items-center justify-center rounded-lg border border-swing-border/55 bg-swing-paper px-3 py-2 text-xs font-semibold text-swing-ink/80 transition hover:bg-swing-cream/50 sm:flex-none"
                    >
                      {labels.edit}
                    </button>
                  ) : null}
                  {item.canComplete && !isEditing ? (
                    <button
                      type="button"
                      onClick={() => startComplete(item)}
                      className="inline-flex min-h-[38px] flex-1 items-center justify-center rounded-lg border border-swing-teal/30 bg-swing-teal/10 px-3 py-2 text-xs font-semibold text-swing-teal-deep transition hover:bg-swing-teal/15 sm:flex-none"
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
                    className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-swing-border/55 bg-swing-paper px-3 text-xs font-semibold text-swing-ink/80 transition hover:bg-swing-cream/50 disabled:cursor-not-allowed disabled:text-swing-muted/45"
                  >
                    {labels.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={() => submitEdit(item)}
                    disabled={isUpdating}
                    className="inline-flex min-h-[36px] items-center justify-center rounded-lg bg-swing-teal-deep px-3 text-xs font-semibold text-swing-paper transition hover:bg-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70"
                  >
                    {isUpdating ? labels.updating : labels.update}
                  </button>
                </div>
              ) : null}

              {item.canComplete && completingItemId === item.id ? (
                <div className="mt-4 border-t border-swing-teal/20 bg-swing-teal/5 p-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-swing-teal-deep">{labels.completeMemo}</span>
                    <textarea
                      value={checkedMemo}
                      onChange={(event) => setCheckedMemo(event.target.value)}
                      placeholder={labels.completeMemoPlaceholder}
                      rows={2}
                      className="mt-1.5 min-h-[64px] w-full resize-y rounded-lg border border-swing-teal/30 bg-swing-paper px-3 py-2 text-sm leading-6 text-swing-ink outline-none transition placeholder:text-swing-muted focus:border-swing-teal focus:ring-2 focus:ring-swing-teal/40"
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelComplete}
                      disabled={isCompleting}
                      className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-swing-border/55 bg-swing-paper px-3 text-xs font-semibold text-swing-ink/80 transition hover:bg-swing-cream/50 disabled:cursor-not-allowed disabled:text-swing-muted/45"
                    >
                      {labels.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={() => submitComplete(item)}
                      disabled={isCompleting}
                      className="inline-flex min-h-[36px] items-center justify-center rounded-lg bg-swing-teal-deep px-3 text-xs font-semibold text-swing-paper transition hover:bg-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70"
                    >
                      {isCompleting ? labels.completing : labels.confirmComplete}
                    </button>
                  </div>
                </div>
              ) : null}

              <dl className="mt-4 grid gap-3 border-t border-swing-border/20 pt-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <dt className="text-xs font-semibold text-swing-muted">{labels.createdBy}</dt>
                  <dd className="mt-1 font-semibold text-swing-ink">{item.createdByName || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-swing-muted">{labels.assignedTo}</dt>
                  <dd className="mt-1 font-semibold text-swing-ink">{formatAssigneeNames(item, labels)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-swing-muted">{labels.createdAt}</dt>
                  <dd className="mt-1 text-swing-ink/80">{formatDate(item.createdAt, langCd)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-swing-muted">{labels.status}</dt>
                  <dd className="mt-1 text-swing-ink/80">{labels.statusLabels[item.status] || item.status}</dd>
                </div>
                {item.status === "DONE" ? (
                  <>
                    <div>
                      <dt className="text-xs font-semibold text-swing-muted">{labels.checkedBy}</dt>
                      <dd className="mt-1 font-semibold text-swing-ink">{item.checkedByName || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-swing-muted">{labels.checkedMemo}</dt>
                      <dd className="mt-1 whitespace-pre-wrap text-swing-ink/80">{item.checkedMemo || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-swing-muted">{labels.checkedAt}</dt>
                      <dd className="mt-1 text-swing-ink/80">{formatDate(item.checkedAt, langCd)}</dd>
                    </div>
                  </>
                ) : null}
              </dl>

              <div className="mt-4 rounded-lg border border-swing-border/30 bg-swing-cream/50 px-3 py-2.5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => toggleComments(item.id)}
                    aria-expanded={isCommentsOpen}
                    className="flex min-h-[32px] w-full min-w-0 items-center gap-2 text-left text-sm text-swing-ink/80 transition hover:text-swing-ink sm:flex-1"
                  >
                    <span className="shrink-0 rounded-full bg-swing-paper px-2 py-1 text-xs font-bold text-swing-ink/80">
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
                          ? "border border-swing-border/45 bg-swing-paper text-swing-ink/80 hover:bg-swing-cream/50"
                          : "bg-swing-teal-deep text-swing-paper hover:bg-swing-teal"
                      }`}
                    >
                      {isCommentsOpen ? labels.commentToggleClose : labels.commentOpenAction}
                    </button>
                  </div>
                </div>
              </div>

              {isCommentsOpen ? (
                <section className="mt-3 border-t border-swing-border/20 pt-4">
                  <div className="grid gap-3">
                    {comments.length === 0 ? (
                      <p className="rounded-lg bg-swing-cream/50 px-3 py-3 text-sm text-swing-muted">{labels.noComments}</p>
                    ) : (
                      comments.map((comment) => (
                        <div
                          key={comment.id || `${item.id}-${comment.createdAt}`}
                          className="border-l-2 border-swing-border/30 pl-3"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-swing-ink">{comment.createdByName || "-"}</span>
                            <span className="text-xs font-semibold text-swing-muted/70">
                              {formatDate(comment.createdAt, langCd)}
                            </span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-swing-ink/80">{comment.content}</p>
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
                      className="min-h-[64px] w-full resize-y rounded-lg border border-swing-border/70 bg-swing-cream px-3 py-2 text-sm leading-6 text-swing-ink outline-none transition placeholder:text-swing-muted focus:border-swing-teal focus:ring-2 focus:ring-swing-teal/40"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => submitComment(item)}
                        disabled={commentingItemId === item.id}
                        className="inline-flex min-h-[40px] w-full items-center justify-center rounded-lg bg-swing-teal-deep px-3 py-2 text-sm font-semibold text-swing-paper transition hover:bg-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70 sm:w-auto"
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
