# Member Display Guidelines

Swingpop keeps member rows after withdrawal so class applications, messages, and other operating records remain connected. Admin screens must show enough context for operators to identify the record, while never restoring or exposing withdrawn account identifiers.

## Basic Rules

- Use the existing name priority for each screen: `nickname`, `displayName`, `applicantName`, then a safe fallback.
- Do not expose or attempt to recover original email, provider ID, Google `sub`, or other masked identifiers.
- Use the shared frontend component `MemberNameLabel` when showing member names in admin screens.
- Treat missing `memberStatus`, missing `member`, or guest applications as non-member records.

## ACTIVE Members

ACTIVE members are displayed normally.

```jsx
<MemberNameLabel name={member.nickname || member.displayName} status={member.status} />
```

Example:

```text
감자
```

## WITHDRAWN Members

WITHDRAWN members keep their display name for operating records, but admin screens must append a small red `(Del)` badge.

Example:

```text
감자 (Del)
```

The badge should be subtle and only large enough for operators to distinguish deleted accounts.

## Guest Applicants

Guest applications do not have member withdrawal state. Show the applicant-entered name exactly as the existing screen does, without `(Del)`.

```jsx
<MemberNameLabel name={application.applicantName} status={application.memberStatus} />
```

When `memberStatus` is `null` or missing, no deletion badge is shown.

## Admin vs. User Screens

- Admin screens may show withdrawn member names with `(Del)` because operators need historical context.
- General user-facing screens should avoid adding administrative deletion markers unless the product explicitly requires it.
- Masked emails may appear only where the screen already showed email for admin operations; never introduce original provider identifiers.

## New Screen Checklist

1. Confirm whether the displayed person is a linked member or a guest applicant.
2. Ensure the backend response includes `memberStatus` or `status` for linked members when the admin UI needs deletion state.
3. Render names through `MemberNameLabel`.
4. Never add provider ID, Google `sub`, access token, refresh token, or unmasked personal identifiers to the response or UI.
