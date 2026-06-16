import React, { useCallback, useEffect, useMemo, useState } from "react";

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
    shared: "전체 운영진",
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
    assignee: "Assignee",
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
    assignedTo: "Assignee",
    createdAt: "Created",
    status: "Status",
    checkedBy: "Completed by",
    checkedMemo: "Completion memo",
    checkedAt: "Completed",
    shared: "All staff",
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

function AssigneeSelect({ labels, assignees, value, onChange, disabled }) {
  return (
    <select
      name="assignedToUserId"
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="min-h-[42px] w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-zinc-100"
    >
      <option value="">{labels.allStaff}</option>
      {assignees.map((assignee) => (
        <option key={assignee.userId} value={assignee.userId}>
          {assignee.name}
        </option>
      ))}
    </select>
  );
}

export function OperationCheckQuickInput({ token, langCd, onChanged }) {
  const labels = copyFor(langCd);
  const [assignees, setAssignees] = useState([]);
  const [form, setForm] = useState({ content: "", assignedToUserId: "" });
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
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
        assignedToUserId: form.assignedToUserId || null,
      });
      setForm({ content: "", assignedToUserId: "" });
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

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_260px]">
        <label className="block">
          <span className="text-xs font-semibold text-zinc-600">{labels.content}</span>
          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            placeholder={labels.contentPlaceholder}
            rows={2}
            className="mt-1.5 min-h-[64px] w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-zinc-600">{labels.assignee}</span>
          <div className="mt-1.5">
            <AssigneeSelect
              labels={labels}
              assignees={assignees}
              value={form.assignedToUserId}
              onChange={handleChange}
              disabled={isSaving}
            />
          </div>
        </label>
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
  const [isLoading, setIsLoading] = useState(false);
  const [completingItemId, setCompletingItemId] = useState(null);
  const [checkedMemo, setCheckedMemo] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
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

  const startComplete = (item) => {
    setCompletingItemId(item.id);
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

        {items.map((item) => (
          <article key={item.id} className="rounded-lg border border-zinc-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={item.status} labels={labels} />
                  <span className="text-xs font-semibold text-zinc-500">{formatDate(item.createdAt, langCd)}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-900">{item.content}</p>
              </div>
              {item.canComplete ? (
                <button
                  type="button"
                  onClick={() => startComplete(item)}
                  className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-teal-200 bg-teal-50 px-3 text-xs font-semibold text-teal-800 transition hover:bg-teal-100"
                >
                  {labels.complete}
                </button>
              ) : null}
            </div>

            {item.canComplete && completingItemId === item.id ? (
              <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-3">
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

            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
              <div>
                <dt className="text-xs font-semibold text-zinc-500">{labels.createdBy}</dt>
                <dd className="mt-1 font-semibold text-zinc-900">{item.createdByName || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-zinc-500">{labels.assignedTo}</dt>
                <dd className="mt-1 font-semibold text-zinc-900">{item.assignedToName || labels.shared}</dd>
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
          </article>
        ))}
      </div>
    </section>
  );
}
