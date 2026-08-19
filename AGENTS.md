# AGENTS.md

## Project Overview

This repository is the Swingpop / Lindyhop Seoul web project.

- Workspace: `C:\Users\User\vscodeProject\lindyhopseoul`
- Frontend: React 18 + Vite 5 + Tailwind CSS at the repository root.
- Backend: Spring Boot 4.0.6 + Java 21 + Maven in `backend/`.
- Database: MariaDB for local development through `docker-compose.yml`.
- Public site routes and member flows live mostly in `src/App.jsx`.
- Admin UI lives mostly in `src/AdminApp.jsx` plus feature panels such as `src/EventManagementPanel.jsx`, `src/KnowledgeBasePanel.jsx`, `src/OperationCheckPanel.jsx`, and `src/AdminCorkboardPanel.jsx`.
- Backend packages are grouped by feature under `backend/src/main/java/com/lindyhopseoul/backend/`.

Important directories:

- `src/`: Vite React frontend source.
- `src/api/`: frontend API clients.
- `public/`: static frontend assets.
- `backend/`: Spring Boot backend.
- `backend/src/main/resources/`: Spring application config.
- `backend/src/test/java/`: backend tests.
- `docs/`: feature and local-runtime documentation.
- `scripts/`: local helper scripts.
- `dist/`, `node_modules/`, `backend/target/`, log files: generated or local-only outputs.

## Local Runtime

Read `docs/local-dev-runtime.md` and the repository-root `.env` before starting or restarting local servers.

Current local development convention:

- Frontend Vite: `http://localhost:5173`
- Backend Spring Boot API: `http://localhost:18080`
- MariaDB: `127.0.0.1:3307`
- DB name: `lindyhopseoul`
- DB user: `lindyhop_dev`
- DB password: development default in `.env.example`

The backend local profile imports `../.env` from `backend/src/main/resources/application-local.yml`.

CORS defaults include both `http://localhost:5173` and `http://127.0.0.1:5173`. Keep both when local testing may mix hostnames. Some frontend API clients have a fallback of `http://localhost:8080`; for this project's current local setup, use `.env` / `.env.example` with `VITE_API_BASE_URL=http://localhost:18080`.

## Commands

Run frontend commands from the repository root:

```powershell
npm install
npm run dev
npm run build
```

For a strict local Vite port matching project docs:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Run backend commands from `backend/`:

```powershell
mvn spring-boot:run
mvn test
```

Start local MariaDB from the repository root:

```powershell
docker compose up -d mariadb
```

Start both dev servers with the helper script:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-local-dev.ps1
```

## Project Documentation Map

Use project docs before changing related code:

- `README.md`: overall structure, setup, broad API overview.
- `docs/deployment.md`: production host and paths, the manual deploy procedure, cache configuration, rollback, known gaps.
- `docs/local-dev-runtime.md`: local ports, OAuth runtime assumptions, restart checklist.
- `docs/google-oauth-member-login.md`: Google OAuth, member session, privacy/security notes.
- `docs/member-display-guidelines.md`: member display, withdrawal handling, `(Del)` admin badge rules.
- `docs/admin-i18n.md`: admin Korean/English UI translation rules.
- `docs/agora-corkboard.md`: Corkboard requirements, APIs, permissions, placement, QA checklist.

`AGENTS.md` is the project-wide operating and safety guide. Feature docs contain detailed requirements and implementation notes. Do not duplicate large feature specs in `AGENTS.md`; point to the relevant document instead.

Before work:

- Read `AGENTS.md`.
- Read the relevant feature doc in `docs/`.
- Inspect current code and current `git status`.

After behavior changes, consider updating the relevant feature doc, development log/checklist, and tests. If docs and code disagree, do not guess. Compare the actual code, the most recent docs, and the requested change, then report the mismatch.

## Development Rules

Prefer existing project patterns, naming, DTO shapes, API client style, and UI conventions.

Keep changes small and directly tied to the request. Avoid adding dependencies unless there is a clear need and the existing stack cannot reasonably handle it.

Do not touch unrelated class, party, registration/application, member, message, admin, or Corkboard behavior. Do not modify unrelated untracked files, generated images, PNG screenshots, logs, `dist/`, `node_modules/`, or `backend/target/`.

Preserve Korean/English user flows unless the request explicitly changes them.

## Git / Change Safety

Before editing, check:

```powershell
git status --short
git diff --name-only
```

If Git reports dubious ownership in this environment, use a read-only per-command safe directory override rather than changing global config:

```powershell
git -c safe.directory=C:/Users/User/vscodeProject/lindyhopseoul status --short
```

Never revert, delete, rename, overwrite, or reformat user changes unless explicitly asked. Do not commit unless explicitly requested.

## Database / Migration Safety

Local JPA uses `ddl-auto: update`; production migration policy is not explicit in this repository.

Do not make destructive DB changes unless explicitly requested. Preserve existing member, application, message, and Corkboard data. Prefer backward-compatible schema changes. If schema or data migration is needed, document the SQL/procedure clearly and identify any risk.

Do not store Google access tokens, refresh tokens, profile images, or provider IDs in frontend-visible responses.

## Member / Auth Notes

General members are Google OAuth members in `member`. Public members currently have `MemberRole.USER`; admin/staff/teacher roles are separate admin account roles.

Maintain guest class/event application flow unless explicitly changed. `POST /api/public/applications` supports unauthenticated applications.

### Admin routes are closed by default

`AdminApiAuthInterceptor` authenticates every request under `/api/admin/**`,
`/api/teacher/**` and `/api/memos/**`, so a controller added under those
prefixes is protected whether or not it remembers to ask. It keeps two
allowlists: `/api/admin/auth/login` and `/api/admin/auth/logout` need no session
at all, and `/api/admin/auth/me` plus `/api/admin/auth/me/password` stay
reachable while an account still owes a password change. Both match a path
exactly, so anything else fails closed.

Handlers still call `AdminSessionService.requirePrincipal` to get the principal
they act on — the answer is cached per request, so it costs nothing — but that
call is no longer what stands between a stranger and the data. Do not remove the
interceptor to "simplify"; before it, forgetting one line left a route public
with nothing failing. `/api/memos/**` is under it because that is exactly what
had happened there.

Spring Security itself is still `permitAll` throughout (`SecurityConfig`), so a
new prefix outside those three is public unless it is added here or guards
itself. Member routes authenticate per handler via
`CurrentMemberService.requireCurrentMember`.

`POST /api/admin/auth/google` is the third allowlisted route: it signs staff in
with the member session they already hold, for accounts a super admin paired via
`USER_M.MEMBER_ID`. It is a way in, so it cannot require the admin token it
issues — the member cookie is its credential. It does not bypass
`mustChangePassword`. Read `docs/google-oauth-member-login.md` before touching
it; the host-only session cookie is the part that surprises people.

## Registration Defaults

What the event and lesson registration forms pre-fill with is data, not code. It
lives in `event_type_default` / `lesson_type_default` (plus their translation
tables) and is edited in the admin app under 설정 › 등록 기본값
(`src/EventDefaultsPanel.jsx`, super admin only).

`EventDefaultsBootstrap` seeds each event type once, and only when that type has
no row, so it fills in a newly added type without overwriting an edit. Do not
reintroduce these values as literals in `src/EventManagementPanel.jsx` — it
holds them in module scope and loads them from `GET /api/admin/event-defaults`
before it will open a form.

Reading the defaults needs event-management permission, because the registration
form itself reads them; writing needs SUPER_ADMIN. Event and lesson types stay
backend enums: the screen edits their defaults, it does not add types.

Both sign-ins are stored in the database and last 90 days, sliding, so a deploy
does not sign anyone out. Members use a Spring Session JDBC cookie session; see
`docs/google-oauth-member-login.md`. Admins use a bearer token in
`AdminSessionService`, stored as a SHA-256 hash in `admin_session` and holding
only the account id — roles, language and password state are read off the
account on every request, so revoking a role or deactivating an account takes
effect immediately rather than waiting out the session.

Local runs get an admin session for free: `DevAdminSessionBootstrap` issues one
at startup and logs it, so no password has to be typed to reach the admin API or
UI. It is `@Profile("local")`, never a property — production must not be able to
switch it on — and `DevAdminSessionBootstrapTest` fails if that guard is
dropped. See `docs/local-dev-runtime.md` for how to use the token.

For logged-in member applications, server-side member identity wins over client-sent applicant names. The backend derives the applicant name from nickname, display name, or email prefix.

Only `ACTIVE` members are treated as current members. `SUSPENDED` members cannot use member-only features and are blocked during Google OAuth login. `WITHDRAWN` members are not active.

Member withdrawal preserves records by keeping the member row and linked history, while masking external identifiers and email. Current code changes `provider`, `provider_id`, `email`, `status`, and `withdrawn_at`; display name and nickname are currently preserved for operational history.

Admin member list/view can be used by `SUPER_ADMIN` and `STAFF`; member suspend/reactivate is `SUPER_ADMIN` only. Use `MemberNameLabel` for admin member names so withdrawn members show the existing `(Del)` badge consistently.

## Corkboard Notes

Read `docs/agora-corkboard.md` before Corkboard work.

Main files:

- `src/CorkboardPage.jsx`
- `src/AdminCorkboardPanel.jsx`
- `src/corkboard.css`
- `src/api/corkboards.js`
- `src/api/admin.js`
- `backend/src/main/java/com/lindyhopseoul/backend/agora/*`
- `backend/src/test/java/com/lindyhopseoul/backend/agora/CorkboardServiceTest.java`

User `/corkboard` should keep the warm corkboard/sticker style. Admin Corkboard should remain an operations-focused management UI, not a decorative public page.

Coordinate placement uses:

- `positionX`
- `positionY`
- `rotationDeg`
- `zIndex`
- `placementMode`

New free-position notes still keep `slotIndex` for page capacity and fallback. Existing slot-only notes must continue to render using deterministic fallback coordinates.

`hidden` and `deleted` are different:

- `hidden`: admin moderation flag; excluded from public responses but available in admin.
- `deleted`: member soft-delete flag; excluded from public/archive/admin note lists and cannot be edited/moved/moderated again.

Archived or read-only boards must block user write/edit/delete/move. Member note movement is only for the owner's visible `MEMBER` note on the current writable board. Admin position edits are only for the current writable board.

Do not replay note creation/move animations on refresh or ordinary re-render. Current public UI uses `freshNoteId` for newly created notes and movement phase state for intentional move actions. Preserve mobile long-press movement and the centered move confirmation flow on small screens.

## UI / Responsive Notes

Keep Korean/English behavior intact. For admin UI text, follow `docs/admin-i18n.md` and the `I18N` object in `src/AdminApp.jsx`.

Check both desktop and mobile after UI changes. Pay special attention around 390px width. Avoid horizontal overflow, clipped buttons, and overlapping labels.

Admin pages should stay compact and operations-focused unless explicitly requested otherwise.

## Verification

Use the narrowest checks that cover the change:

- Frontend changes: run `npm run build` from the repository root.
- Backend changes: run `mvn test` from `backend/`.
- UI changes: verify desktop and mobile layouts.
- Corkboard changes: verify both user `/corkboard` and admin Corkboard.
- Member/auth/application/message changes: run related backend tests and manually check the affected member/admin flow when practical.

If verification cannot be run, report exactly what was not run and why.

## Backend Restart Safety

After backend code or configuration changes, run backend tests first when practical:

```powershell
cd backend
mvn test
```

If tests pass and a local backend restart is useful, only stop/restart the process on `localhost:18080` when it is clearly this project's Spring Boot backend.

On Windows, identify the process first:

```powershell
netstat -ano | findstr :18080
Get-CimInstance Win32_Process -Filter "ProcessId=<PID>" | Select-Object ProcessId,CommandLine
```

Only terminate/restart when the command line clearly points to this workspace's backend. If uncertain, do not stop it; report the manual restart command instead.

Do not stop unrelated Java processes, other project servers, the DB container, or the frontend dev server unless the user explicitly asks to restart the test environment. In the final summary, state whether backend restart was performed and the result.

## Test Server Restart Rule

When backend or frontend runtime code changes and the user asks to test, restart the affected local dev servers before reporting completion.

Current local test targets:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:18080`

After restart, verify:

- `GET http://localhost:5173` returns 200
- `GET http://localhost:18080/api/agora/corkboards/current` returns 200

If both frontend and backend were changed, restart both. If only backend changed, restart backend at minimum.

Do not stop unrelated processes. On Windows, identify port owners before stopping them.
