import React, { useCallback, useEffect, useMemo, useState } from "react";

import { adminApi } from "./api/admin";
import MemberNameLabel, { formatMemberDisplayName } from "./MemberNameLabel";
import { SecondaryButton } from "./EventManagementPanel";

const COPY = {
  Kor: {
    title: "구글 계정 연동",
    intro:
      "운영진이 일반 회원으로 가입한 구글 계정을 연결하면, 그 계정으로 관리자 로그인을 할 수 있습니다. 연결은 로그인 수단을 하나 더하는 것일 뿐, 권한을 바꾸지 않습니다.",
    passwordNote:
      "연결해도 비밀번호를 한 번도 설정하지 않은 계정은 여전히 비밀번호 설정 화면에서 막힙니다.",
    account: "운영진 계정",
    roles: "권한",
    linkedMember: "연결된 회원",
    actions: "",
    notLinked: "연결 안 됨",
    link: "연결",
    change: "변경",
    unlink: "해제",
    unlinking: "해제 중",
    saving: "저장 중",
    cancel: "취소",
    pickMember: "연결할 회원 선택",
    search: "이름 또는 이메일로 검색",
    noMembers: "조건에 맞는 활성 회원이 없습니다.",
    noAccounts: "표시할 운영진 계정이 없습니다.",
    loading: "불러오는 중…",
    linkedTo: (name) => `${name} 님에게 연결했습니다.`,
    unlinked: "연결을 해제했습니다.",
    confirmUnlink: (account) => `${account} 계정의 구글 연동을 해제할까요? 비밀번호 로그인은 그대로 쓸 수 있습니다.`,
    activeOnly: "활성 회원만 연결할 수 있습니다.",
    pendingPassword: "비밀번호 미설정",
  },
  Eng: {
    title: "Google Account Links",
    intro:
      "Link the Google account a staff member registered with, and they can sign in to the admin app with it. A link adds a way in; it does not change what the account may do.",
    passwordNote:
      "A linked account that has never set a password is still held at the password screen.",
    account: "Admin account",
    roles: "Roles",
    linkedMember: "Linked member",
    actions: "",
    notLinked: "Not linked",
    link: "Link",
    change: "Change",
    unlink: "Unlink",
    unlinking: "Unlinking",
    saving: "Saving",
    cancel: "Cancel",
    pickMember: "Choose a member to link",
    search: "Search by name or email",
    noMembers: "No active member matches.",
    noAccounts: "No admin accounts to show.",
    loading: "Loading…",
    linkedTo: (name) => `Linked to ${name}.`,
    unlinked: "Link removed.",
    confirmUnlink: (account) => `Remove the Google link for ${account}? Password sign-in keeps working.`,
    activeOnly: "Only an active member can be linked.",
    pendingPassword: "No password set",
  },
};

function roleLabel(roles) {
  return Array.isArray(roles) && roles.length > 0 ? roles.join(", ") : "-";
}

/**
 * Super admin only, and enforced server-side — this screen is only ever reached
 * through a menu the backend grants, but the API refuses anyone else regardless.
 */
export default function AdminGoogleLinkPanel({ token, langCd }) {
  const copy = COPY[langCd] || COPY.Kor;

  const [links, setLinks] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // The account whose member is being picked, or null when the list is at rest.
  const [editingUserId, setEditingUserId] = useState(null);
  const [search, setSearch] = useState("");
  const [busyUserId, setBusyUserId] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      // Members come from the existing admin member list rather than a new
      // endpoint; this screen only ever needs the ones that can actually be
      // linked, which the filter below narrows to.
      const [nextLinks, nextMembers] = await Promise.all([
        adminApi.findGoogleLinks(token),
        adminApi.findMembers(token),
      ]);
      setLinks(nextLinks || []);
      setMembers(nextMembers || []);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const linkedMemberIds = useMemo(
    () => new Set(links.map((link) => link.memberId).filter((id) => id !== null && id !== undefined)),
    [links]
  );

  const selectableMembers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (members || [])
      // A withdrawn or suspended member cannot sign in, so linking one would be a
      // row that never works. The backend refuses it too.
      .filter((member) => String(member.memberStatus || "").toUpperCase() === "ACTIVE")
      .filter((member) => {
        if (!term) {
          return true;
        }
        return [member.displayName, member.nickname, member.email]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      });
  }, [members, search]);

  const startEditing = (userId) => {
    setEditingUserId(userId);
    setSearch("");
    setNotice("");
    setError("");
  };

  const applyUpdatedLink = (updated) => {
    setLinks((current) => current.map((link) => (link.userId === updated.userId ? updated : link)));
  };

  const handleLink = async (userId, member) => {
    setBusyUserId(userId);
    setError("");
    try {
      const updated = await adminApi.linkGoogleAccount(token, userId, member.memberId);
      applyUpdatedLink(updated);
      setNotice(copy.linkedTo(formatMemberDisplayName(member)));
      setEditingUserId(null);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setBusyUserId(null);
    }
  };

  const handleUnlink = async (link) => {
    if (!window.confirm(copy.confirmUnlink(link.name || link.loginId))) {
      return;
    }
    setBusyUserId(link.userId);
    setError("");
    try {
      const updated = await adminApi.unlinkGoogleAccount(token, link.userId);
      applyUpdatedLink(updated);
      setNotice(copy.unlinked);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <section className="grid gap-4">
      <header className="grid gap-2">
        <h2 className="text-lg font-bold text-swing-ink">{copy.title}</h2>
        <p className="text-sm leading-relaxed text-swing-ink/70">{copy.intro}</p>
        <p className="text-xs leading-relaxed text-swing-ink/60">{copy.passwordNote}</p>
      </header>

      {error ? (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="rounded-lg border border-swing-teal/40 bg-swing-cream px-3 py-2 text-sm text-swing-teal-deep">
          {notice}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-swing-ink/60">{copy.loading}</p>
      ) : links.length === 0 ? (
        <p className="text-sm text-swing-ink/60">{copy.noAccounts}</p>
      ) : (
        <ul className="grid gap-3">
          {links.map((link) => {
            const isEditing = editingUserId === link.userId;
            const isBusy = busyUserId === link.userId;

            return (
              <li
                key={link.userId}
                className="rounded-lg border border-swing-border/30 bg-swing-paper p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-semibold text-swing-ink">{link.name || link.loginId}</span>
                      <span className="text-xs text-swing-ink/60">{link.loginId}</span>
                      {link.mustChangePassword ? (
                        <span className="text-xs font-semibold text-amber-700">{copy.pendingPassword}</span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-swing-ink/60">
                      {copy.roles}: {roleLabel(link.roles)}
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-swing-ink/60">{copy.linkedMember}: </span>
                      {link.memberId ? (
                        <MemberNameLabel member={link} />
                      ) : (
                        <span className="text-swing-ink/50">{copy.notLinked}</span>
                      )}
                      {link.memberId && link.memberEmail ? (
                        <span className="ml-2 text-xs text-swing-ink/50">{link.memberEmail}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <SecondaryButton
                      type="button"
                      onClick={() => (isEditing ? setEditingUserId(null) : startEditing(link.userId))}
                      disabled={isBusy}
                    >
                      {isEditing ? copy.cancel : link.memberId ? copy.change : copy.link}
                    </SecondaryButton>
                    {link.memberId ? (
                      <SecondaryButton type="button" onClick={() => handleUnlink(link)} disabled={isBusy}>
                        {isBusy ? copy.unlinking : copy.unlink}
                      </SecondaryButton>
                    ) : null}
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4 border-t border-swing-border/30 pt-4">
                    <label className="grid gap-1.5 text-sm">
                      <span className="font-medium text-swing-ink">{copy.pickMember}</span>
                      <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={copy.search}
                        className="min-h-[44px] w-full rounded-lg border border-swing-border/40 bg-swing-paper px-3 text-sm text-swing-ink"
                        autoFocus
                      />
                    </label>

                    {selectableMembers.length === 0 ? (
                      <p className="mt-3 text-sm text-swing-ink/60">{copy.noMembers}</p>
                    ) : (
                      <ul className="mt-3 grid max-h-64 gap-2 overflow-y-auto">
                        {selectableMembers.map((member) => {
                          // Already spoken for by some other account. Shown rather
                          // than hidden, so it is clear why it cannot be picked.
                          const takenElsewhere =
                            linkedMemberIds.has(member.memberId) && member.memberId !== link.memberId;

                          return (
                            <li key={member.memberId}>
                              <button
                                type="button"
                                onClick={() => handleLink(link.userId, member)}
                                disabled={isBusy || takenElsewhere}
                                className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg border border-swing-border/30 px-3 py-2 text-left text-sm transition hover:bg-swing-cream disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <MemberNameLabel member={member} />
                                <span className="shrink-0 text-xs text-swing-ink/50">{member.email}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
