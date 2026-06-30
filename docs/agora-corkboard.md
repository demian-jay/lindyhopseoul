# Agora Corkboard

## Purpose

Agora Corkboard is the community-wall feature for short public notes, staff notices, external event blurbs, and guestbook-style member messages. It is intentionally not a traditional notice board: the UI presents notes as pinned or taped memo stickers on a corkboard.

## Backend

Package: `com.lindyhopseoul.backend.agora`

Tables created by JPA:

- `corkboard`
  - `id`
  - `period_key`, for example `2026-07`
  - `title`
  - `period_start`
  - `period_end`
  - `page_no`
  - `status`: `ACTIVE` or `ARCHIVED`
  - `created_at`
  - `updated_at`
- `corkboard_note`
  - `id`
  - `board_id`
  - `member_id`, nullable for staff notices
  - `note_type`: `OFFICIAL` or `MEMBER`
  - `sticker_template_key`
  - `content`
  - `slot_index`
  - `position_x`, nullable percentage coordinate from 0.0 to 100.0
  - `position_y`, nullable percentage coordinate from 0.0 to 100.0
  - `rotation_deg`, nullable display rotation, currently limited to -6.0 through 6.0
  - `z_index`, nullable stacking order for overlap handling
  - `placement_mode`: `SLOT` or `FREE`
  - `hidden`
  - `author_nickname_snapshot`
  - `author_name_snapshot`
  - `created_at`
  - `updated_at`

`corkboard.period_key + page_no` is unique. `corkboard_note.board_id + slot_index` is unique.

## Periods and Pages

The service uses the current date in `Asia/Seoul` to find an `ACTIVE` corkboard period whose `period_start <= today <= period_end`.
If no matching active period exists, it falls back to the default monthly `periodKey`.

There is no scheduler. On current-board reads and note creation, the service:

1. Archives expired active boards whose `period_end` is before today.
2. Creates the default current month board if no board row exists for that fallback period.
3. Adds new notes to the requested writable board page when that page still has a free slot, otherwise falls back to the next writable page with capacity.
4. Creates the next page automatically when all 18 slots are occupied.

Past boards are read-only.

Admin period management is implemented without a separate `corkboard_period` table. The backend groups `corkboard` rows by `period_key`; Board 1, Board 2, and later pages for the same `period_key` share the same title and date range. When a super admin edits period settings, all rows with that `period_key` are updated together.

Scheduled boards are normal `ACTIVE` rows with a future date range. They become the current writable board automatically when the current date enters their configured period. New period creation rejects duplicate `periodKey` values and overlapping active date ranges.

`period_end` is inclusive. A board whose `period_end` is `2026-07-31` remains the current writable board through July 31, 2026 in `Asia/Seoul`. On August 1, 2026 or later, the board is archived on the next current-board read, archive read, admin period read, or note creation attempt. Archived boards remain readable, but public/member write UI is read-only.

Future scheduled boards are not returned as the current board before `period_start`. If no active board covers today, the service falls back to the default monthly period for today; if an archived row already exists for that fallback period, it is returned as read-only instead of creating a duplicate active board.

## Note Placement

New public member notes use free placement on the corkboard:

- The client sends `positionX` and `positionY` as board-relative percentages, not pixels.
- The client sends `rotationDeg` within the small corkboard rotation range.
- The server validates `positionX` and `positionY` from `0` to `100` and `rotationDeg` from `-6` to `6`.
- The server still assigns `slotIndex` so the existing 18-note page capacity and next-page creation rules remain stable.
- New coordinate-based notes are stored with `placementMode=FREE`.

Legacy and fallback behavior:

- Existing notes that only have `slotIndex` continue to render.
- If `positionX` or `positionY` is missing, the frontend computes a stable fallback position from `slotIndex`.
- Such notes are treated as `placementMode=SLOT` even if older rows have `placement_mode` unset.
- The public board can show old slot-based notes and new free-position notes together.

The frontend clamps rendered note centers away from the board edge so notes do not spill far outside the corkboard on desktop or mobile.

Existing note position edits:

- Logged-in members can move only their own visible `MEMBER` notes on the current writable board.
- Members cannot move other members' notes, hidden notes, `OFFICIAL` notes, or archived board notes.
- `STAFF` and `SUPER_ADMIN` can move notes from the admin Corkboard panel for the current writable board.
- The public member UI starts movement with a long press of about 380ms on the user's own note, then shows a drop confirmation panel before sending the PATCH request.
- Cancelling the drop confirmation clears the temporary preview and returns the note to its saved position.
- Editing a legacy slot-only note stores `position_x`, `position_y`, `rotation_deg`, and changes `placement_mode` to `FREE`; `slot_index` stays unchanged for page capacity and fallback compatibility.

## Validation and Permissions

Public users:

- Can read the current board.
- Can read archived boards.
- Cannot write.

Logged-in members:

- Can create `MEMBER` notes only on the current active board.
- Can adjust the position of their own visible `MEMBER` notes on the current active board.
- Cannot edit note content or delete notes in this MVP.

Staff and super admins:

- Can create `OFFICIAL` notes through the admin panel.
- Can hide or unhide any note.
- Can adjust note positions from the admin panel on the current writable board.
- Can view current and past boards, including hidden notes.

Staff:

- Can view board periods.
- Can create `OFFICIAL` notes.
- Can hide or unhide notes.
- Cannot edit board periods, create new periods, or manually archive a period.

Super admins:

- Can edit the current period title, `periodStart`, and `periodEnd`.
- Can create or reserve a new period.
- Can manually archive a period.
- Period edits apply to every board page with the same `periodKey`.

Permission matrix:

| Capability | Public | Logged-in member | STAFF | SUPER_ADMIN |
| --- | --- | --- | --- | --- |
| View current board | Yes | Yes | Yes | Yes |
| View archived boards | Yes | Yes | Yes | Yes |
| Create member note | No | Current writable board only | No | No |
| Move own member note | No | Own visible note on current writable board only | No | No |
| Create official notice | No | No | Yes | Yes |
| Move note position in admin | No | No | Current writable board | Current writable board |
| Hide/unhide notes | No | No | Yes | Yes |
| View hidden notes in admin | No | No | Yes | Yes |
| Edit period title/start/end | No | No | No | Yes |
| Create or reserve period | No | No | No | Yes |
| Manually archive period | No | No | No | Yes |

Content rules:

- Server trims `content`.
- Blank content is rejected.
- Max content length is 200 characters.
- Author snapshots are taken from the server-side member/admin session, never from the client.
- Public responses exclude `hidden=true` notes.
- React renders note content as text, so HTML/script input is not executed.
- Coordinate input is accepted only for the current writable board. Archived boards remain read-only.

## APIs

Public:

- `GET /api/agora/corkboards/current`
- `GET /api/agora/corkboards/archive`
- `GET /api/agora/corkboards?periodKey=YYYY-MM`
- `POST /api/agora/corkboard-notes`
- `PATCH /api/agora/corkboard-notes/{id}/position`

Admin:

- `GET /api/admin/agora/corkboards`
- `GET /api/admin/agora/corkboards?periodKey=YYYY-MM`
- `GET /api/admin/agora/corkboard-periods`
- `GET /api/admin/agora/corkboard-periods/current`
- `POST /api/admin/agora/corkboard-periods`
- `PATCH /api/admin/agora/corkboard-periods/{periodKey}`
- `PATCH /api/admin/agora/corkboard-periods/{periodKey}/archive`
- `POST /api/admin/agora/corkboard-notes`
- `PATCH /api/admin/agora/corkboard-notes/{id}/hidden`
- `PATCH /api/admin/agora/corkboard-notes/{id}/position`

`GET /api/admin/agora/corkboard-periods` returns period-level summaries grouped by `periodKey`, including page count, note count, status, and whether the period is currently writable. Mutating period endpoints require `SUPER_ADMIN`.

Public note creation request body:

```json
{
  "stickerTemplateKey": "yellow",
  "content": "See you at practice!",
  "positionX": 25.4,
  "positionY": 38.7,
  "rotationDeg": -2.5,
  "pageNo": 1
}
```

`positionX`, `positionY`, `rotationDeg`, and `pageNo` are optional for backward compatibility. If coordinates are omitted, the server stores a slot-style placement. The current user screen sends coordinates for new member notes.

Admin official note creation accepts the same optional placement fields. The current admin UI keeps a simpler operations-first layout and may use automatic fallback placement for official notices.

Position update request body:

```json
{
  "positionX": 62.8,
  "positionY": 44.2,
  "rotationDeg": -3.4
}
```

The member endpoint requires the server session to match the note owner. The admin endpoint requires a staff/admin bearer token. Both endpoints validate the same coordinate ranges and currently allow edits only on the current writable board.

## Admin Operations

Creating or reserving a new month:

1. Open the admin menu `CORKBOARD`.
2. In `새 보드 생성 / 예약`, enter `periodKey` as six digits in `YYYYMM` format, for example `202607`.
3. Confirm that the title is generated automatically as `Swingpop 2026년 07월 보드`.
4. Select `periodStart` and `periodEnd`. `periodStart` must be before `periodEnd`.
5. Save with `새 보드 생성`.

The client sends the server `periodKey` in the existing storage/API format, for example `2026-07`. The server creates Board 1 for the new period and keeps the existing 18-note page rollover behavior for later pages. Free-position notes still count toward the same 18-note page limit.

Operational rules:

- Do not create overlapping active/reserved periods. The server rejects overlaps on create and update.
- Use future `periodStart` and `periodEnd` to reserve a board before the month begins.
- Use manual archive only when the current board should close early. This changes all board pages for that `periodKey` to `ARCHIVED`.
- After manual archive, public/member users can still read the board, but cannot write to it.
- Hidden notes remain visible in admin and remain excluded from public responses.

## Frontend

User entry point:

- `/corkboard`
- Also linked from the main hero as `Agora Corkboard`.

Admin entry point:

- Admin menu `CORKBOARD`
- Available to `SUPER_ADMIN` and `STAFF`.
- The top of the panel shows current period settings, page count, note count, writable state, a super-admin settings form, a super-admin new-board form, and past board navigation.
- In the super-admin new-board form, `periodKey` is entered as six digits (`YYYYMM`) and the title is generated automatically as `Swingpop YYYY년 MM월 보드`; the client converts the key to the existing API/storage format (`YYYY-MM`) before sending.

Main files:

- `src/CorkboardPage.jsx`
- `src/AdminCorkboardPanel.jsx`
- `src/corkboard.css`
- `src/api/corkboards.js`
- `src/api/admin.js`

Design notes:

- The board uses CSS cork texture, wood frame, shadows, and free-position note placement.
- Desktop renders notes at board-relative percentage coordinates.
- Mobile keeps the corkboard surface and supports touch drag or tap-to-place without horizontal overflow.
- Note templates include yellow, pink, blue, white, lined, tape, pin, and staff notice styles.
- Notes have slight rotation, shadow, hover lift, selected outline, and attach/land animations.
- The write flow includes template selection, live preview, character count, board tap/drag placement, and submit feedback.
- Owner position editing uses long press, drag, and drop confirmation. There is no separate move button on the public board.
- The admin panel uses compact numeric `positionX`, `positionY`, and `rotationDeg` inputs per note card to keep the management layout operational.
- Existing slot-only notes use deterministic fallback coordinates from `slotIndex`.

## QA Status

Last verified: 2026-06-30, local dev environment.

Runtime used for verification:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:18080`
- Local database: MariaDB on `127.0.0.1:3307`

Completed checks:

- `/corkboard` loads the current board.
- `GET /api/agora/corkboards/current` returns `200`.
- Google OAuth starts from `http://localhost:18080/oauth2/authorization/google`, not `8080`.
- Desktop corkboard rendering keeps the cork texture, wood frame, pinned/taped notes, shadows, and note rotation.
- Mobile rendering keeps a stable single-column board layout without horizontal overflow.
- Note templates remain visually distinct across yellow, pink, blue, white, lined, tape, pin, and official styles.
- The note landing/attach animations, hover lift, selected outline, tape, pin, and official notice emphasis are present.
- Member note placement supports board tap, pointer drag, and touch drag. Reloaded notes stay in the saved percentage position.
- Existing slot-only notes and new free-position notes render together on the same board.
- Owner note position editing saves through `PATCH /api/agora/corkboard-notes/{id}/position` only after the drop confirmation is accepted; after refresh, edited notes stay at the saved percentage coordinates.
- Admin note position editing is available from each admin note card and preserves the list/card management layout.
- Archived boards are read-only.
- Admin Corkboard period settings render on desktop and mobile without horizontal overflow.
- Admin current period info displays `periodKey`, title, start/end dates, status, page count, note count, and writable state.
- Super-admin period controls are visible for the local super admin account.
- Period creation, duplicate rejection, same-period page updates, manual archive, and staff rejection are covered by `CorkboardServiceTest`.

## QA Checklist

Non-member:

- [x] Can open `/corkboard`.
- [x] Can view the current board.
- [x] Can browse archived boards when archives exist.
- [x] Cannot create a note.
- [x] Sees a friendly login prompt instead of a plain form.
- [x] Does not see notes with `hidden=true`.
- [x] Mobile layout has no horizontal overflow.

Logged-in member:

- [x] Can select a sticker template.
- [x] Can see a live note preview.
- [x] Can tap the board or drag the preview note to choose where it will be pinned.
- [x] Can enter up to 200 characters and see the remaining count.
- [x] Cannot submit blank content.
- [x] Creates `MEMBER` notes using the server-side member session.
- [x] Sees the newly added note land at the selected board position.
- [x] Sees no public `위치 수정` button; only own movable notes respond to long press.
- [x] Can cancel the drop confirmation and return the note to its saved position.
- [x] Can confirm a dropped position and keep the new position after reload.
- [x] Cannot write to archived boards.
- [x] Cannot edit note content or delete notes in this MVP.

Staff or admin:

- [x] Can access the admin Corkboard menu.
- [x] Can view current and archived corkboards.
- [x] Can create `OFFICIAL` notes from the admin panel.
- [x] Official notes are visually emphasized without looking like a rigid notice board.
- [x] Can hide and unhide notes.
- [x] Hidden notes are still available in the admin view.
- [x] Hidden notes are excluded from public user responses.
- [x] Can see current period information in the admin panel.
- [x] Can see coordinate metadata (`positionX`, `positionY`, `rotationDeg`, `zIndex`, `placementMode`) for note management.
- [x] Can update note coordinates from the admin note card on the current writable board.
- [x] `STAFF` is limited to viewing periods, official notes, note visibility management, and current-board position adjustment.

Super admin:

- [x] Can see period edit controls.
- [x] Can see the new period creation form.
- [x] Can see the current period archive action.
- [x] Period mutation endpoints are restricted to `SUPER_ADMIN`.

## Deferred

The MVP intentionally excludes:

- Resizing notes.
- Image uploads.
- Rich text.
- Comments.
- Likes.
- Realtime updates.
