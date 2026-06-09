# Admin Internationalization Guide

The admin page supports Korean and English through per-account language settings.

## Data Contract

- `ADMIN_USER_M.LANG_CD` stores the admin user's display language.
- `TEACHER_USER_M.LANG_CD` stores the teacher user's display language.
- Supported values are:
  - `Kor`: Korean UI
  - `Eng`: English UI
- API responses for authenticated admin users must include `user.langCd`.
- Account create/update requests for staff and teacher users must include `langCd`.

## UI Translation Pattern

The admin page is intentionally small, so translations are stored in source code instead of the database.
Use the `I18N` object in `src/AdminApp.jsx` as the single source for admin UI labels.

When adding or changing an admin feature:

1. Add Korean and English strings at the same time.
2. Do not hardcode visible admin UI text directly inside JSX.
3. Read labels through the current account language, using `Kor` as the fallback.
4. Keep status, role, menu, button, notice, and table labels translatable.
5. Format dates with the current UI language locale.

## Login Screen

Before login, the account language is not known. The login screen therefore provides a local language toggle and stores that temporary choice in `localStorage`.
After a successful login, the account's `langCd` controls the full admin UI.

## Backend Defaults

If an existing row has no `LANG_CD` value during local schema updates, the backend treats it as `Kor`.
The initial seeded super administrator `admin / 1234` is created with `Kor`.

## Review Checklist

Before shipping an admin page change:

- Confirm `Kor` and `Eng` labels both exist.
- Confirm forms preserve or submit `langCd` when creating/updating accounts.
- Confirm logged-in staff/teacher accounts see menus and notices in their configured language.
- Confirm new backend DTO fields include language where account settings are returned.
