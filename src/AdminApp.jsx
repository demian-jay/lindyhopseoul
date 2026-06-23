import React, { useCallback, useEffect, useMemo, useState } from "react";

import { adminApi } from "./api/admin";
import EventManagementPanel, { MessageTemplatePanel, TeacherDashboardPanel } from "./EventManagementPanel";
import KnowledgeBasePanel from "./KnowledgeBasePanel";
import OperationCheckPanel, { OperationCheckQuickInput } from "./OperationCheckPanel";

const TOKEN_STORAGE_KEY = "swingpop-admin-token";

const LANGUAGES = ["Kor", "Eng"];
const HIDDEN_ADMIN_MENUS = new Set(["TEACHER_USERS"]);

const I18N = {
  Kor: {
    brand: "SwingPop Admin",
    checkingSession: "관리자 세션 확인 중",
    menus: {
      DASHBOARD: "관리자 홈",
      OPERATION_CHECK: "운영 체크",
      EVENT_MANAGEMENT: "이벤트/강습 관리",
      MEMBER_MESSAGES: "회원 메시지",
      KNOWLEDGE_BASE: "메뉴얼 저장소",
      MESSAGE_TEMPLATES: "메시지 템플릿",
      ADMIN_USERS: "사용자 계정 관리",
      TEACHER_USERS: "강사 프로필 관리",
    },
    roles: {
      SUPER_ADMIN: "수퍼관리자",
      STAFF: "동호회 운영진",
      TEACHER: "강사",
      MEMBER: "회원",
    },
    statuses: {
      Y: "사용",
      N: "비활성",
    },
    languages: {
      label: "언어",
      Kor: "한국어",
      Eng: "English",
    },
    login: {
      title: "관리자 로그인",
      loginId: "아이디",
      password: "비밀번호",
      submit: "로그인",
      submitting: "로그인 중",
    },
    common: {
      cancel: "취소",
      create: "등록",
      edit: "수정",
      save: "수정 완료",
      saving: "저장 중",
      delete: "삭제",
      deactivate: "비활성화",
      logout: "로그아웃",
      loading: "불러오는 중",
      count: (count) => `${count}개`,
      empty: "-",
    },
    fields: {
      name: "이름",
      loginId: "아이디",
      password: "비밀번호",
      newPassword: "새 비밀번호",
      role: "권한",
      status: "상태",
      language: "표시 언어",
      updatedAt: "수정일",
      actions: "작업",
    },
    knowledgeBase: {
      searchLabel: "검색",
      searchPlaceholder: "카테고리, 제목, 요약, 본문, 태그로 검색",
      categoryFilter: "카테고리",
      allCategories: "전체 카테고리",
      manualLanguage: "매뉴얼 언어",
      translationMissing: "Translation missing",
      resultsTitle: "검색 결과",
      noResults: "검색 결과가 없습니다.",
      selectItem: "왼쪽 목록에서 문서를 선택해주세요.",
      category: "카테고리",
      categoryName: "카테고리명",
      categoryDescription: "설명",
      categoryListTitle: "카테고리 목록",
      title: "제목",
      summary: "요약",
      content: "본문",
      tags: "태그",
      tagsPlaceholder: "쉼표로 구분해 입력",
      status: "상태",
      statuses: {
        DRAFT: "초안",
        PUBLISHED: "게시",
        ARCHIVED: "보관",
      },
      displayOrder: "표시 순서",
      decisionDate: "결정일",
      effectiveFrom: "적용 시작일",
      effectiveTo: "적용 종료일",
      sourceNote: "출처 메모",
      lastUpdated: "마지막 수정일",
      createItemTitle: "문서 등록",
      editItemTitle: "문서 수정",
      createCategoryTitle: "카테고리 등록",
      editCategoryTitle: "카테고리 수정",
      itemCreated: "운영 매뉴얼 문서가 등록되었습니다.",
      itemUpdated: "운영 매뉴얼 문서가 수정되었습니다.",
      itemDeleted: "운영 매뉴얼 문서가 삭제되었습니다.",
      categoryCreated: "카테고리가 등록되었습니다.",
      categoryUpdated: "카테고리가 수정되었습니다.",
      categoryDeleted: "카테고리가 삭제되었습니다.",
      confirmDeleteItem: (title) => `${title} 문서를 삭제할까요?`,
      confirmDeleteCategory: (name) => `${name} 카테고리를 삭제할까요?`,
    },
    dashboard: {
      title: "관리자 홈",
      accessMenus: "접근 메뉴",
    },
    memberMessages: {
      title: "회원 메시지",
      listTitle: "대화방",
      detailTitle: "대화 내역",
      replyPlaceholder: "회원에게 답변을 남겨주세요.",
      reply: "답변 보내기",
      replying: "보내는 중",
      loading: "불러오는 중",
      emptyThreads: "아직 회원 메시지가 없습니다.",
      selectThread: "왼쪽에서 대화방을 선택해주세요.",
      noMessages: "메시지가 없습니다.",
      sent: "답변이 전송되었습니다.",
      loadError: "메시지를 불러오지 못했습니다.",
      sendError: "답변을 보내지 못했습니다.",
      memberInfo: "회원 정보",
      lastMessage: "마지막 메시지",
      lastMessageAt: "마지막 시간",
      adminSender: "Swingpop 운영진",
    },
    adminUsers: {
      createTitle: "사용자 계정 등록",
      editTitle: "사용자 계정 수정",
      listTitle: "사용자 계정",
      created: "사용자 계정이 등록되었습니다.",
      updated: "사용자 계정이 수정되었습니다.",
      deactivated: "사용자 계정이 비활성화되었습니다.",
      confirmDeactivate: (name) => `${name} 계정을 비활성화할까요?`,
    },
    teacherUsers: {
      createTitle: "강사 프로필 등록",
      editTitle: "강사 프로필 수정",
      listTitle: "강사 프로필",
      created: "강사 프로필이 등록되었습니다.",
      updated: "강사 프로필이 수정되었습니다.",
      deactivated: "강사 프로필이 비활성화되었습니다.",
      confirmDeactivate: (name) => `${name} 강사 프로필을 비활성화할까요?`,
    },
  },
  Eng: {
    brand: "SwingPop Admin",
    checkingSession: "Checking admin session",
    menus: {
      DASHBOARD: "Dashboard",
      OPERATION_CHECK: "Operation Check",
      EVENT_MANAGEMENT: "Events & Lessons",
      MEMBER_MESSAGES: "Member Messages",
      KNOWLEDGE_BASE: "Manual Repository",
      MESSAGE_TEMPLATES: "Message Templates",
      ADMIN_USERS: "User Accounts",
      TEACHER_USERS: "Teacher Profiles",
    },
    roles: {
      SUPER_ADMIN: "Super Admin",
      STAFF: "Staff",
      TEACHER: "Teacher",
      MEMBER: "Member",
    },
    statuses: {
      Y: "Active",
      N: "Inactive",
    },
    languages: {
      label: "Language",
      Kor: "Korean",
      Eng: "English",
    },
    login: {
      title: "Admin Login",
      loginId: "Login ID",
      password: "Password",
      submit: "Log In",
      submitting: "Logging in",
    },
    common: {
      cancel: "Cancel",
      create: "Create",
      edit: "Edit",
      save: "Save Changes",
      saving: "Saving",
      delete: "Delete",
      deactivate: "Deactivate",
      logout: "Log Out",
      loading: "Loading",
      count: (count) => `${count} items`,
      empty: "-",
    },
    fields: {
      name: "Name",
      loginId: "Login ID",
      password: "Password",
      newPassword: "New Password",
      role: "Role",
      status: "Status",
      language: "Display Language",
      updatedAt: "Updated",
      actions: "Actions",
    },
    knowledgeBase: {
      searchLabel: "Search",
      searchPlaceholder: "Search categories, titles, summaries, content, and tags",
      categoryFilter: "Category",
      allCategories: "All Categories",
      manualLanguage: "Manual Language",
      translationMissing: "Translation missing",
      resultsTitle: "Results",
      noResults: "No matching documents.",
      selectItem: "Select a document from the list.",
      category: "Category",
      categoryName: "Category Name",
      categoryDescription: "Description",
      categoryListTitle: "Categories",
      title: "Title",
      summary: "Summary",
      content: "Content",
      tags: "Tags",
      tagsPlaceholder: "Separate tags with commas",
      status: "Status",
      statuses: {
        DRAFT: "Draft",
        PUBLISHED: "Published",
        ARCHIVED: "Archived",
      },
      displayOrder: "Display Order",
      decisionDate: "Decision Date",
      effectiveFrom: "Effective From",
      effectiveTo: "Effective To",
      sourceNote: "Source Note",
      lastUpdated: "Last Updated",
      createItemTitle: "Create Document",
      editItemTitle: "Edit Document",
      createCategoryTitle: "Create Category",
      editCategoryTitle: "Edit Category",
      itemCreated: "Knowledge base document has been created.",
      itemUpdated: "Knowledge base document has been updated.",
      itemDeleted: "Knowledge base document has been deleted.",
      categoryCreated: "Category has been created.",
      categoryUpdated: "Category has been updated.",
      categoryDeleted: "Category has been deleted.",
      confirmDeleteItem: (title) => `Delete ${title}?`,
      confirmDeleteCategory: (name) => `Delete ${name} category?`,
    },
    dashboard: {
      title: "Dashboard",
      accessMenus: "Available Menus",
    },
    memberMessages: {
      title: "Member Messages",
      listTitle: "Threads",
      detailTitle: "Conversation",
      replyPlaceholder: "Write a reply to this member.",
      reply: "Send Reply",
      replying: "Sending",
      loading: "Loading",
      emptyThreads: "No member messages yet.",
      selectThread: "Select a thread from the left.",
      noMessages: "No messages.",
      sent: "Reply sent.",
      loadError: "Could not load messages.",
      sendError: "Could not send reply.",
      memberInfo: "Member Info",
      lastMessage: "Last Message",
      lastMessageAt: "Last Updated",
      adminSender: "Swingpop Team",
    },
    adminUsers: {
      createTitle: "Create User Account",
      editTitle: "Edit User Account",
      listTitle: "User Accounts",
      created: "User account has been created.",
      updated: "User account has been updated.",
      deactivated: "User account has been deactivated.",
      confirmDeactivate: (name) => `Deactivate ${name}?`,
    },
    teacherUsers: {
      createTitle: "Create Teacher Profile",
      editTitle: "Edit Teacher Profile",
      listTitle: "Teacher Profiles",
      created: "Teacher profile has been created.",
      updated: "Teacher profile has been updated.",
      deactivated: "Teacher profile has been deactivated.",
      confirmDeactivate: (name) => `Deactivate ${name}'s teacher profile?`,
    },
  },
};

function getLabels(langCd) {
  return I18N[langCd] || I18N.Kor;
}

function formatDate(value, langCd) {
  if (!value) {
    return getLabels(langCd).common.empty;
  }

  return new Intl.DateTimeFormat(langCd === "Eng" ? "en-US" : "ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const ROLE_ORDER = ["SUPER_ADMIN", "STAFF", "TEACHER", "MEMBER"];

function normalizeRoles(userLike) {
  const roles = Array.isArray(userLike?.roles) && userLike.roles.length > 0 ? userLike.roles : [userLike?.role].filter(Boolean);
  return ROLE_ORDER.filter((role) => roles.includes(role));
}

function primaryRole(userLike) {
  return normalizeRoles(userLike)[0] || "MEMBER";
}

function hasRole(userLike, role) {
  return normalizeRoles(userLike).includes(role);
}

function hasAnyRole(userLike, roles) {
  return roles.some((role) => hasRole(userLike, role));
}

function filterVisibleMenus(menus = []) {
  return menus.filter((menu) => !HIDDEN_ADMIN_MENUS.has(menu));
}

function createAdminForm() {
  return {
    adminUserNm: "",
    loginId: "",
    password: "",
    role: "STAFF",
    roles: ["STAFF"],
    langCd: "Kor",
    useYn: "Y",
  };
}

function createTeacherForm() {
  return {
    teacherUserNm: "",
    loginId: "",
    password: "",
    langCd: "Kor",
    useYn: "Y",
  };
}

function StatusBadge({ useYn, labels }) {
  const isActive = useYn === "Y";

  return (
    <span
      className={`inline-flex min-w-[72px] items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-zinc-200 bg-zinc-100 text-zinc-500"
      }`}
    >
      {labels.statuses[useYn] || useYn}
    </span>
  );
}

function RoleBadge({ role, labels }) {
  const className =
    role === "SUPER_ADMIN"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : role === "STAFF"
        ? "border-teal-200 bg-teal-50 text-teal-800"
        : role === "TEACHER"
          ? "border-violet-200 bg-violet-50 text-violet-800"
          : "border-zinc-200 bg-zinc-50 text-zinc-700";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {labels.roles[role] || role}
    </span>
  );
}

function RoleBadges({ item, labels }) {
  const roles = normalizeRoles(item);

  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role) => (
        <RoleBadge key={role} role={role} labels={labels} />
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-zinc-600">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="min-h-[42px] w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-zinc-100"
    />
  );
}

function SelectInput(props) {
  return (
    <select
      {...props}
      className="min-h-[42px] w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-zinc-100"
    />
  );
}

function Notice({ type = "error", children }) {
  if (!children) {
    return null;
  }

  const className =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-red-200 bg-red-50 text-red-700";

  return <div className={`rounded-lg border px-3 py-2 text-sm leading-6 ${className}`}>{children}</div>;
}

function LanguageOptions({ labels }) {
  return LANGUAGES.map((langCd) => (
    <option key={langCd} value={langCd}>
      {labels.languages[langCd]}
    </option>
  ));
}

function LoginScreen({ onLogin }) {
  const [form, setForm] = useState({ loginId: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loginLabels = {
    brand: "SwingPop Admin",
    title: "관리자 로그인 / Admin Login",
    loginId: "아이디 / Login ID",
    password: "비밀번호 / Password",
    submit: "로그인 / Log In",
    submitting: "로그인 중 / Logging in",
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const session = await adminApi.login({
        loginId: form.loginId.trim(),
        password: form.password,
      });
      onLogin(session);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 px-5 py-10 text-zinc-900">
      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-md items-center">
        <form onSubmit={handleSubmit} className="w-full rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-5">
            <div>
              <div className="text-sm font-semibold text-teal-700">{loginLabels.brand}</div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">{loginLabels.title}</h1>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <Field label={loginLabels.loginId}>
              <TextInput
                name="loginId"
                type="text"
                autoComplete="username"
                value={form.loginId}
                onChange={handleChange}
                autoFocus
              />
            </Field>
            <Field label={loginLabels.password}>
              <TextInput
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
              />
            </Field>
          </div>

          <div className="mt-5" aria-live="polite">
            <Notice>{error}</Notice>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-300"
          >
            {isSubmitting ? loginLabels.submitting : loginLabels.submit}
          </button>
        </form>
      </main>
    </div>
  );
}

function DashboardPanel({ session, labels }) {
  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-950">{labels.dashboard.title}</h2>
            <div className="mt-2 text-sm text-zinc-500">{session.user.userNm}</div>
          </div>
          <RoleBadges item={session.user} labels={labels} />
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <dt className="text-xs font-semibold text-zinc-500">{labels.fields.loginId}</dt>
            <dd className="mt-1 text-sm font-semibold text-zinc-900">{session.user.loginId}</dd>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <dt className="text-xs font-semibold text-zinc-500">{labels.fields.role}</dt>
            <dd className="mt-1 text-sm font-semibold text-zinc-900">
              {normalizeRoles(session.user)
                .map((role) => labels.roles[role] || role)
                .join(", ")}
            </dd>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <dt className="text-xs font-semibold text-zinc-500">{labels.fields.language}</dt>
            <dd className="mt-1 text-sm font-semibold text-zinc-900">{labels.languages[session.user.langCd]}</dd>
          </div>
        </dl>
      </div>

    </section>
  );
}

function AdminUsersPanel({ token, currentUser, langCd, labels }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(() => ({ ...createAdminForm(), langCd }));
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isEditing = editingId !== null;
  const canManageSuperAdmin = hasRole(currentUser, "SUPER_ADMIN");

  const roleOptions = useMemo(() => {
    if (canManageSuperAdmin || form.roles.includes("SUPER_ADMIN")) {
      return ROLE_ORDER;
    }
    return ["STAFF", "TEACHER", "MEMBER"];
  }, [canManageSuperAdmin, form.roles]);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setItems(await adminApi.findAdmins(token));
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...createAdminForm(), langCd });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleRoleToggle = (role) => {
    setForm((currentForm) => {
      const nextRoles = currentForm.roles.includes(role)
        ? currentForm.roles.filter((currentRole) => currentRole !== role)
        : [...currentForm.roles, role];
      const normalizedRoles = normalizeRoles({ roles: nextRoles }).filter(
        (nextRole) => canManageSuperAdmin || nextRole !== "SUPER_ADMIN",
      );
      const safeRoles = normalizedRoles.length > 0 ? normalizedRoles : ["STAFF"];
      return {
        ...currentForm,
        role: primaryRole({ roles: safeRoles }),
        roles: safeRoles,
      };
    });
  };

  const handleEdit = (item) => {
    setEditingId(item.adminUserCd);
    const roles = normalizeRoles(item);
    setForm({
      adminUserNm: item.adminUserNm,
      loginId: item.loginId,
      password: "",
      role: primaryRole(item),
      roles,
      langCd: item.langCd || "Kor",
      useYn: item.useYn,
    });
    setError("");
    setNotice("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSaving(true);

    const payload = {
      adminUserNm: form.adminUserNm.trim(),
      loginId: form.loginId.trim(),
      password: form.password.trim() || null,
      role: primaryRole(form),
      roles: form.roles,
      langCd: form.langCd,
      useYn: form.useYn,
    };

    try {
      if (isEditing) {
        await adminApi.updateAdmin(token, editingId, payload);
        setNotice(labels.adminUsers.updated);
      } else {
        await adminApi.createAdmin(token, {
          adminUserNm: payload.adminUserNm,
          loginId: payload.loginId,
          password: form.password,
          role: payload.role,
          roles: payload.roles,
          langCd: payload.langCd,
        });
        setNotice(labels.adminUsers.created);
      }
      resetForm();
      await loadItems();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (item) => {
    if (!window.confirm(labels.adminUsers.confirmDeactivate(item.adminUserNm))) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await adminApi.deactivateAdmin(token, item.adminUserCd);
      setNotice(labels.adminUsers.deactivated);
      await loadItems();
    } catch (nextError) {
      setError(nextError.message);
    }
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[390px_1fr]">
      <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-4">
          <h2 className="text-lg font-bold text-zinc-950">
            {isEditing ? labels.adminUsers.editTitle : labels.adminUsers.createTitle}
          </h2>
          {isEditing ? (
            <button type="button" onClick={resetForm} className="text-sm font-semibold text-zinc-500 hover:text-zinc-900">
              {labels.common.cancel}
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4">
          <Field label={labels.fields.name}>
            <TextInput name="adminUserNm" value={form.adminUserNm} onChange={handleChange} />
          </Field>
          <Field label={labels.fields.loginId}>
            <TextInput name="loginId" value={form.loginId} onChange={handleChange} />
          </Field>
          <Field label={isEditing ? labels.fields.newPassword : labels.fields.password}>
            <TextInput
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </Field>
          <Field label={labels.fields.role}>
            <div className="grid gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              {roleOptions.map((role) => (
                <label key={role} className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <input
                    type="checkbox"
                    checked={form.roles.includes(role)}
                    onChange={() => handleRoleToggle(role)}
                    disabled={!canManageSuperAdmin && role === "SUPER_ADMIN"}
                    className="h-4 w-4 rounded border-zinc-300 text-teal-700 focus:ring-teal-600"
                  />
                  {labels.roles[role]}
                </label>
              ))}
            </div>
          </Field>
          <Field label={labels.fields.language}>
            <SelectInput name="langCd" value={form.langCd} onChange={handleChange}>
              <LanguageOptions labels={labels} />
            </SelectInput>
          </Field>
          {isEditing ? (
            <Field label={labels.fields.status}>
              <SelectInput name="useYn" value={form.useYn} onChange={handleChange}>
                <option value="Y">{labels.statuses.Y}</option>
                <option value="N">{labels.statuses.N}</option>
              </SelectInput>
            </Field>
          ) : null}
        </div>

        <div className="mt-5 grid gap-2" aria-live="polite">
          <Notice>{error}</Notice>
          <Notice type="success">{notice}</Notice>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="mt-5 inline-flex min-h-[42px] w-full items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-300"
        >
          {isSaving ? labels.common.saving : isEditing ? labels.common.save : labels.common.create}
        </button>
      </form>

      <AccountTable
        title={labels.adminUsers.listTitle}
        isLoading={isLoading}
        items={items}
        labels={labels}
        langCd={langCd}
        getKey={(item) => item.adminUserCd}
        getName={(item) => item.adminUserNm}
        getCode={(item) => item.adminUserCd}
        onEdit={handleEdit}
        onDeactivate={handleDeactivate}
        canEdit={(item) => canManageSuperAdmin || !hasRole(item, "SUPER_ADMIN")}
        canDeactivate={(item) =>
          (canManageSuperAdmin || !hasRole(item, "SUPER_ADMIN")) &&
          (item.userId || item.adminUserCd) !== (currentUser.userId || currentUser.userCd) &&
          item.useYn !== "N"
        }
      />
    </section>
  );
}

function TeacherUsersPanel({ token, langCd, labels }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(() => ({ ...createTeacherForm(), langCd }));
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isEditing = editingId !== null;

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setItems(await adminApi.findTeachers(token));
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...createTeacherForm(), langCd });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleEdit = (item) => {
    setEditingId(item.teacherUserCd);
    setForm({
      teacherUserNm: item.teacherUserNm,
      loginId: item.loginId,
      password: "",
      langCd: item.langCd || "Kor",
      useYn: item.useYn,
    });
    setError("");
    setNotice("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSaving(true);

    const payload = {
      teacherUserNm: form.teacherUserNm.trim(),
      loginId: form.loginId.trim(),
      password: form.password.trim() || null,
      langCd: form.langCd,
      useYn: form.useYn,
    };

    try {
      if (isEditing) {
        await adminApi.updateTeacher(token, editingId, payload);
        setNotice(labels.teacherUsers.updated);
      } else {
        await adminApi.createTeacher(token, {
          teacherUserNm: payload.teacherUserNm,
          loginId: payload.loginId,
          password: form.password,
          langCd: payload.langCd,
        });
        setNotice(labels.teacherUsers.created);
      }
      resetForm();
      await loadItems();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (item) => {
    if (!window.confirm(labels.teacherUsers.confirmDeactivate(item.teacherUserNm))) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await adminApi.deactivateTeacher(token, item.teacherUserCd);
      setNotice(labels.teacherUsers.deactivated);
      await loadItems();
    } catch (nextError) {
      setError(nextError.message);
    }
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[390px_1fr]">
      <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-4">
          <h2 className="text-lg font-bold text-zinc-950">
            {isEditing ? labels.teacherUsers.editTitle : labels.teacherUsers.createTitle}
          </h2>
          {isEditing ? (
            <button type="button" onClick={resetForm} className="text-sm font-semibold text-zinc-500 hover:text-zinc-900">
              {labels.common.cancel}
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4">
          <Field label={labels.fields.name}>
            <TextInput name="teacherUserNm" value={form.teacherUserNm} onChange={handleChange} />
          </Field>
          <Field label={labels.fields.loginId}>
            <TextInput name="loginId" value={form.loginId} onChange={handleChange} />
          </Field>
          <Field label={isEditing ? labels.fields.newPassword : labels.fields.password}>
            <TextInput
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </Field>
          <Field label={labels.fields.language}>
            <SelectInput name="langCd" value={form.langCd} onChange={handleChange}>
              <LanguageOptions labels={labels} />
            </SelectInput>
          </Field>
          {isEditing ? (
            <Field label={labels.fields.status}>
              <SelectInput name="useYn" value={form.useYn} onChange={handleChange}>
                <option value="Y">{labels.statuses.Y}</option>
                <option value="N">{labels.statuses.N}</option>
              </SelectInput>
            </Field>
          ) : null}
        </div>

        <div className="mt-5 grid gap-2" aria-live="polite">
          <Notice>{error}</Notice>
          <Notice type="success">{notice}</Notice>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="mt-5 inline-flex min-h-[42px] w-full items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-300"
        >
          {isSaving ? labels.common.saving : isEditing ? labels.common.save : labels.common.create}
        </button>
      </form>

      <AccountTable
        title={labels.teacherUsers.listTitle}
        isLoading={isLoading}
        items={items}
        labels={labels}
        langCd={langCd}
        getKey={(item) => item.teacherUserCd}
        getName={(item) => item.teacherUserNm}
        onEdit={handleEdit}
        onDeactivate={handleDeactivate}
        canEdit={() => true}
        canDeactivate={(item) => item.useYn !== "N"}
      />
    </section>
  );
}

function AccountTable({
  title,
  isLoading,
  items,
  labels,
  langCd,
  getKey,
  getName,
  onEdit,
  onDeactivate,
  canEdit,
  canDeactivate,
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        <h2 className="text-lg font-bold text-zinc-950">{title}</h2>
        <span className="text-sm text-zinc-500">{isLoading ? labels.common.loading : labels.common.count(items.length)}</span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[860px] w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-xs font-semibold uppercase text-zinc-500">
              <th className="border-b border-zinc-200 px-3 py-2">{labels.fields.name}</th>
              <th className="border-b border-zinc-200 px-3 py-2">{labels.fields.loginId}</th>
              <th className="border-b border-zinc-200 px-3 py-2">{labels.fields.role}</th>
              <th className="border-b border-zinc-200 px-3 py-2">{labels.fields.language}</th>
              <th className="border-b border-zinc-200 px-3 py-2">{labels.fields.status}</th>
              <th className="border-b border-zinc-200 px-3 py-2">{labels.fields.updatedAt}</th>
              <th className="border-b border-zinc-200 px-3 py-2 text-right">{labels.fields.actions}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={getKey(item)} className="align-middle">
                <td className="border-b border-zinc-100 px-3 py-3 font-semibold text-zinc-900">{getName(item)}</td>
                <td className="border-b border-zinc-100 px-3 py-3 text-zinc-600">{item.loginId}</td>
                <td className="border-b border-zinc-100 px-3 py-3">
                  <RoleBadges item={item} labels={labels} />
                </td>
                <td className="border-b border-zinc-100 px-3 py-3 text-zinc-600">
                  {labels.languages[item.langCd || "Kor"]}
                </td>
                <td className="border-b border-zinc-100 px-3 py-3">
                  <StatusBadge useYn={item.useYn} labels={labels} />
                </td>
                <td className="border-b border-zinc-100 px-3 py-3 text-zinc-500">{formatDate(item.modDt, langCd)}</td>
                <td className="border-b border-zinc-100 px-3 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      disabled={!canEdit(item)}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-300"
                    >
                      {labels.common.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeactivate(item)}
                      disabled={!canDeactivate(item)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-zinc-300"
                    >
                      {labels.common.deactivate}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminMemberMessagesPanel({ token, langCd, labels }) {
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reply, setReply] = useState("");
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const messageLabels = labels.memberMessages;

  const loadThreads = useCallback(async () => {
    setIsLoadingThreads(true);
    setError("");

    try {
      const nextThreads = await adminApi.findMemberMessageThreads(token);
      const safeThreads = Array.isArray(nextThreads) ? nextThreads : [];
      setThreads(safeThreads);
      setSelectedThreadId((currentThreadId) => {
        if (currentThreadId && safeThreads.some((thread) => thread.threadId === currentThreadId)) {
          return currentThreadId;
        }
        return safeThreads[0]?.threadId ?? null;
      });
    } catch (nextError) {
      setError(nextError.message || messageLabels.loadError);
      setThreads([]);
      setSelectedThreadId(null);
    } finally {
      setIsLoadingThreads(false);
    }
  }, [messageLabels.loadError, token]);

  const loadDetail = useCallback(async () => {
    if (!selectedThreadId) {
      setDetail(null);
      return;
    }

    setIsLoadingDetail(true);
    setError("");

    try {
      setDetail(await adminApi.findMemberMessageThread(token, selectedThreadId));
    } catch (nextError) {
      setError(nextError.message || messageLabels.loadError);
      setDetail(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }, [messageLabels.loadError, selectedThreadId, token]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedReply = reply.trim();
    if (!selectedThreadId || !normalizedReply) {
      setError(messageLabels.sendError);
      return;
    }

    setIsSending(true);
    setError("");
    setNotice("");

    try {
      const nextDetail = await adminApi.createMemberMessageReply(token, selectedThreadId, {
        content: normalizedReply,
      });
      setDetail(nextDetail);
      setReply("");
      setNotice(messageLabels.sent);
      await loadThreads();
    } catch (nextError) {
      setError(nextError.message || messageLabels.sendError);
    } finally {
      setIsSending(false);
    }
  };

  const memberLabel = (member) => {
    if (!member) {
      return labels.common.empty;
    }
    return member.nickname || member.displayName || member.email || labels.common.empty;
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4">
          <h2 className="text-lg font-bold text-zinc-950">{messageLabels.listTitle}</h2>
          <span className="text-sm text-zinc-500">
            {isLoadingThreads ? messageLabels.loading : labels.common.count(threads.length)}
          </span>
        </div>

        {threads.length === 0 && !isLoadingThreads ? (
          <div className="py-8 text-center text-sm text-zinc-500">{messageLabels.emptyThreads}</div>
        ) : (
          <div className="mt-4 grid gap-2">
            {threads.map((thread) => {
              const isSelected = thread.threadId === selectedThreadId;
              return (
                <button
                  key={thread.threadId}
                  type="button"
                  onClick={() => {
                    setSelectedThreadId(thread.threadId);
                    setNotice("");
                    setError("");
                  }}
                  className={`rounded-lg border p-3 text-left transition ${
                    isSelected
                      ? "border-teal-600 bg-teal-50"
                      : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-zinc-950">
                        {thread.memberNickname || thread.memberDisplayName || thread.memberEmail}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">{thread.memberEmail}</div>
                    </div>
                    <div className="shrink-0 text-xs text-zinc-400">
                      {formatDate(thread.lastMessageAt, langCd)}
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600">
                    {thread.lastMessagePreview || labels.common.empty}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="border-b border-zinc-200 pb-4">
          <h2 className="text-lg font-bold text-zinc-950">{messageLabels.detailTitle}</h2>
          {detail?.member ? (
            <div className="mt-3 grid gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600 sm:grid-cols-2">
              <div>
                <span className="font-semibold text-zinc-950">{messageLabels.memberInfo}: </span>
                {memberLabel(detail.member)}
              </div>
              <div>{detail.member.email}</div>
              <div>{detail.member.displayName}</div>
              <div>{detail.member.nickname || labels.common.empty}</div>
            </div>
          ) : null}
        </div>

        <div className="mt-4" aria-live="polite">
          <Notice>{error}</Notice>
          <Notice type="success">{notice}</Notice>
        </div>

        {!selectedThreadId ? (
          <div className="py-12 text-center text-sm text-zinc-500">{messageLabels.selectThread}</div>
        ) : isLoadingDetail ? (
          <div className="py-12 text-center text-sm text-zinc-500">{messageLabels.loading}</div>
        ) : (
          <>
            <div className="mt-4 grid max-h-[520px] gap-3 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              {detail?.messages?.length > 0 ? (
                detail.messages.map((message) => {
                  const isAdmin = message.senderType === "ADMIN";
                  return (
                    <article key={message.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${
                          isAdmin
                            ? "bg-teal-700 text-white"
                            : "border border-zinc-200 bg-white text-zinc-900"
                        }`}
                      >
                        <div className={`text-xs font-semibold ${isAdmin ? "text-white/75" : "text-zinc-500"}`}>
                          {isAdmin ? messageLabels.adminSender : message.senderName}
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                        <div className={`mt-2 text-[11px] ${isAdmin ? "text-white/65" : "text-zinc-400"}`}>
                          {formatDate(message.createdAt, langCd)}
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="py-8 text-center text-sm text-zinc-500">{messageLabels.noMessages}</div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-4">
              <textarea
                value={reply}
                onChange={(event) => {
                  setReply(event.target.value);
                  setError("");
                  setNotice("");
                }}
                maxLength={2000}
                rows={4}
                placeholder={messageLabels.replyPlaceholder}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-sm leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSending}
                  className="inline-flex min-h-[42px] w-full items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-300 sm:w-auto"
                >
                  {isSending ? messageLabels.replying : messageLabels.reply}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </section>
  );
}

export default function AdminApp() {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_STORAGE_KEY) || "");
  const [session, setSession] = useState(null);
  const [activeMenu, setActiveMenu] = useState("DASHBOARD");
  const [isChecking, setIsChecking] = useState(Boolean(token));
  const [operationCheckSummary, setOperationCheckSummary] = useState({ openTotalCount: 0, openAssignedCount: 0 });
  const [operationCheckRefreshKey, setOperationCheckRefreshKey] = useState(0);

  const applySession = useCallback((nextSession) => {
    const nextMenus = filterVisibleMenus(nextSession.menus || []);

    setSession({
      user: {
        ...nextSession.user,
        langCd: nextSession.user?.langCd || "Kor",
        roles: normalizeRoles(nextSession.user),
        role: primaryRole(nextSession.user),
      },
      menus: nextMenus,
    });

    setActiveMenu((currentMenu) => {
      if (nextMenus.includes(currentMenu)) {
        return currentMenu;
      }
      return nextMenus[0] || "DASHBOARD";
    });
  }, []);

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken("");
    setSession(null);
    setActiveMenu("DASHBOARD");
  }, []);

  useEffect(() => {
    if (!token) {
      setIsChecking(false);
      return;
    }

    let isMounted = true;

    adminApi
      .me(token)
      .then((nextSession) => {
        if (isMounted) {
          applySession(nextSession);
        }
      })
      .catch(() => {
        if (isMounted) {
          clearSession();
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsChecking(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [applySession, clearSession, token]);

  const handleLogin = (nextSession) => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, nextSession.accessToken);
    setToken(nextSession.accessToken);
    applySession(nextSession);
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await adminApi.logout(token);
      }
    } finally {
      clearSession();
    }
  };

  const langCd = session?.user?.langCd || "Kor";
  const labels = getLabels(langCd);
  const visibleMenus = useMemo(() => filterVisibleMenus(session?.menus || []), [session?.menus]);
  const safeActiveMenu = visibleMenus.includes(activeMenu) ? activeMenu : visibleMenus[0] || "DASHBOARD";
  const pageTitle = labels.menus[safeActiveMenu] || labels.brand;
  const canUseOperationCheck = session ? hasAnyRole(session.user, ["SUPER_ADMIN", "STAFF"]) : false;
  const shouldShowOperationCheckQuickInput =
    canUseOperationCheck && (safeActiveMenu === "DASHBOARD" || safeActiveMenu === "OPERATION_CHECK");

  const handleOperationCheckChanged = useCallback(() => {
    setOperationCheckRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!token || !canUseOperationCheck) {
      setOperationCheckSummary({ openTotalCount: 0, openAssignedCount: 0 });
      return;
    }

    let isMounted = true;

    adminApi
      .findOperationCheckSummary(token)
      .then((summary) => {
        if (isMounted) {
          setOperationCheckSummary(summary);
        }
      })
      .catch(() => {
        if (isMounted) {
          setOperationCheckSummary({ openTotalCount: 0, openAssignedCount: 0 });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [canUseOperationCheck, operationCheckRefreshKey, token]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 text-sm font-semibold text-zinc-500">
        {labels.checkingSession}
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-teal-700">{labels.brand}</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950">{pageTitle}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <RoleBadges item={session.user} labels={labels} />
            <span className="text-sm font-semibold text-zinc-700">{session.user.userNm}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              {labels.common.logout}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm lg:sticky lg:top-5 lg:h-fit">
          <nav className="grid gap-1">
            {visibleMenus.map((menu) => (
              <button
                key={menu}
                type="button"
                onClick={() => setActiveMenu(menu)}
                className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                  safeActiveMenu === menu
                    ? "bg-teal-700 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                }`}
              >
                <span>{labels.menus[menu] || menu}</span>
                {menu === "OPERATION_CHECK" && operationCheckSummary.openAssignedCount > 0 ? (
                  <span
                    className={`inline-flex min-w-[22px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                      safeActiveMenu === menu ? "bg-white text-teal-700" : "bg-teal-700 text-white"
                    }`}
                  >
                    {operationCheckSummary.openAssignedCount}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </aside>

        <main className="grid gap-5">
          {shouldShowOperationCheckQuickInput ? (
            <OperationCheckQuickInput token={token} langCd={langCd} onChanged={handleOperationCheckChanged} />
          ) : null}
          {safeActiveMenu === "DASHBOARD" ? (
            <div className="grid gap-5">
              {hasAnyRole(session.user, ["SUPER_ADMIN", "STAFF"]) || !hasRole(session.user, "TEACHER") ? (
                <DashboardPanel session={session} labels={labels} />
              ) : null}
              {hasRole(session.user, "TEACHER") ? <TeacherDashboardPanel token={token} langCd={langCd} /> : null}
            </div>
          ) : null}
          {safeActiveMenu === "OPERATION_CHECK" ? (
            <OperationCheckPanel
              token={token}
              langCd={langCd}
              refreshKey={operationCheckRefreshKey}
              onChanged={handleOperationCheckChanged}
            />
          ) : null}
          {safeActiveMenu === "EVENT_MANAGEMENT" ? (
            <EventManagementPanel token={token} currentUser={session.user} langCd={langCd} />
          ) : null}
          {safeActiveMenu === "MEMBER_MESSAGES" ? (
            <AdminMemberMessagesPanel token={token} langCd={langCd} labels={labels} />
          ) : null}
          {safeActiveMenu === "KNOWLEDGE_BASE" ? (
            <KnowledgeBasePanel token={token} currentUser={session.user} langCd={langCd} labels={labels} />
          ) : null}
          {safeActiveMenu === "MESSAGE_TEMPLATES" ? (
            <MessageTemplatePanel token={token} currentUser={session.user} langCd={langCd} />
          ) : null}
          {safeActiveMenu === "ADMIN_USERS" ? (
            <AdminUsersPanel token={token} currentUser={session.user} langCd={langCd} labels={labels} />
          ) : null}
        </main>
      </div>
    </div>
  );
}
