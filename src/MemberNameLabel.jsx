export function isWithdrawnMemberStatus(status) {
  return String(status || "").toUpperCase() === "WITHDRAWN";
}

export function isSuspendedMemberStatus(status) {
  return String(status || "").toUpperCase() === "SUSPENDED";
}

export function formatMemberDisplayName(member, fallback = "-") {
  if (!member) {
    return fallback;
  }

  return (
    member.nickname ||
    member.memberNickname ||
    member.displayName ||
    member.memberDisplayName ||
    member.applicantName ||
    member.email ||
    member.memberEmail ||
    fallback
  );
}

export default function MemberNameLabel({
  member,
  name,
  status,
  fallback = "-",
  className = "",
  badgeClassName = "",
}) {
  const displayName = name || formatMemberDisplayName(member, fallback);
  const memberStatus = status || member?.status || member?.memberStatus;
  const showWithdrawnBadge = isWithdrawnMemberStatus(memberStatus);
  const showSuspendedBadge = isSuspendedMemberStatus(memberStatus);

  return (
    <span className={`inline-flex min-w-0 flex-wrap items-baseline gap-1.5 ${className}`}>
      <span className="min-w-0 break-words">{displayName}</span>
      {showWithdrawnBadge ? (
        <span className={`shrink-0 text-xs font-semibold text-red-600 ${badgeClassName}`}>(Del)</span>
      ) : null}
      {showSuspendedBadge ? (
        <span className={`shrink-0 text-xs font-semibold text-amber-700 ${badgeClassName}`}>(비활성)</span>
      ) : null}
    </span>
  );
}
