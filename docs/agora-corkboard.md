# Corkboard (담벼락)

## Purpose

Corkboard (담벼락) is the community-wall feature for short public notes, staff notices, external event blurbs, and guestbook-style member messages. It is intentionally not a traditional notice board: the UI presents notes as pinned or taped memo stickers on a corkboard.

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
  - `deleted`
  - `deleted_at`
  - `deleted_by_member_id`
  - `content_edited_at`
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
- Can keep only one active, non-deleted `MEMBER` sticker per `periodKey`, even when the period has Board 1, Board 2, and later pages.
- If they pin a new sticker while an active visible `MEMBER` sticker already exists for the same period, the UI asks for confirmation; confirming sends `replaceExisting=true`, soft-deletes the old sticker, and creates the new one.
- Cannot bypass moderation by replacing a hidden note. If their existing `MEMBER` note for the current period is `hidden=true` and `deleted=false`, new note creation is blocked until staff resolves it.
- Can adjust the position of their own visible `MEMBER` notes on the current active board.
- Can edit the content of their own visible `MEMBER` notes on the current active board.
- Can soft-delete their own visible `MEMBER` notes on the current active board.
- Cannot edit or delete other members' notes, hidden notes, `OFFICIAL` notes, or archived-board notes.

Staff and super admins:

- Can create `OFFICIAL` notes through the admin panel.
- Can edit `OFFICIAL` note content through the admin panel.
- Can hide or unhide any note.
- Can adjust note positions from the admin panel on the current writable board.
- Can view current and past boards, including hidden notes.
- Do not directly edit member note content; use hidden/unhidden moderation for inappropriate member notes.

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
| Create member note | No | Current writable board only; one active sticker per period | No | No |
| Replace own active member note | No | Current writable board only; old note is soft-deleted | No | No |
| Move own member note | No | Own visible note on current writable board only | No | No |
| Edit own member note content | No | Own visible note on current writable board only | No | No |
| Delete own member note | No | Own visible note on current writable board only | No | No |
| Create official notice | No | No | Yes | Yes |
| Edit official notice content | No | No | Yes | Yes |
| Edit member note content in admin | No | No | No | No |
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
- Public and archive responses exclude `deleted=true` notes.
- React renders note content as text, so HTML/script input is not executed.
- Coordinate input is accepted only for the current writable board. Archived boards remain read-only.

Moderation and deletion:

- `hidden` is an admin moderation flag. It hides a note from public responses while keeping it manageable in the admin Corkboard view.
- `deleted` is the member soft-delete flag. When a member deletes their own note, or replaces their monthly sticker with a new one, the old row remains in `corkboard_note` with `deleted=true`, `deleted_at`, and `deleted_by_member_id`.
- Member replacement never changes `hidden`; hidden notes remain moderation records and cannot be replaced by the public member flow.
- Deleted notes are excluded from public board responses, archive responses, admin note lists, and period note counts.
- Deleted notes cannot be edited, moved, hidden/unhidden, or deleted again through the Corkboard APIs.
- `content_edited_at` records content edits separately from `updated_at`, because position edits also update the note row.

## APIs

Public:

- `GET /api/agora/corkboards/current`
- `GET /api/agora/corkboards/archive`
- `GET /api/agora/corkboards?periodKey=YYYY-MM`
- `POST /api/agora/corkboard-notes`
- `PATCH /api/agora/corkboard-notes/{id}/position`
- `PATCH /api/agora/corkboard-notes/{id}/content`
- `DELETE /api/agora/corkboard-notes/{id}`

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
- `PATCH /api/admin/agora/corkboard-notes/{id}/content`

`GET /api/admin/agora/corkboard-periods` returns period-level summaries grouped by `periodKey`, including page count, note count, status, and whether the period is currently writable. Mutating period endpoints require `SUPER_ADMIN`.

Public note creation request body:

```json
{
  "stickerTemplateKey": "yellow",
  "content": "See you at practice!",
  "positionX": 25.4,
  "positionY": 38.7,
  "rotationDeg": -2.5,
  "pageNo": 1,
  "replaceExisting": false
}
```

`positionX`, `positionY`, `rotationDeg`, `pageNo`, and `replaceExisting` are optional for backward compatibility. If coordinates are omitted, the server stores a slot-style placement. The current user screen sends coordinates for new member notes.

Member creation policy:

- The server enforces one active, non-deleted `MEMBER` note per `memberId + periodKey`.
- When an existing visible member note exists and `replaceExisting` is missing or `false`, the endpoint returns `409 Conflict` with `CORKBOARD_MEMBER_NOTE_REPLACEMENT_REQUIRED`.
- The public UI maps that conflict to a confirmation modal. Choosing `다시 붙이기` resubmits the same payload with `replaceExisting=true`.
- With `replaceExisting=true`, the old visible member note is soft-deleted and the new note is created in the same transaction. The collection response includes `replacedExisting=true` and `replacedNoteId`.
- Deleted notes are ignored by the creation limit. Other members' notes are ignored.
- If an existing same-period member note is `hidden=true` and `deleted=false`, the endpoint returns `409 Conflict` with `CORKBOARD_MEMBER_NOTE_HIDDEN_REVIEW_REQUIRED`; the public UI tells the member to contact staff instead of creating a replacement.
- `OFFICIAL` notes are not subject to this limit.

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

Member content update request body:

```json
{
  "content": "Updated note text"
}
```

`PATCH /api/agora/corkboard-notes/{id}/content` requires the current server session to own a visible `MEMBER` note on the current writable board. Content is trimmed and limited to 200 characters.

`DELETE /api/agora/corkboard-notes/{id}` performs a soft delete for the current member's own visible `MEMBER` note on the current writable board. The row remains in the database and no longer appears on user-facing boards.

Admin official content update request body:

```json
{
  "content": "Updated staff notice"
}
```

`PATCH /api/admin/agora/corkboard-notes/{id}/content` is limited to `OFFICIAL` notes. Member notes are moderated with hidden/unhidden status instead of direct admin content edits.

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
- Also linked from the main hero as `담벼락` (Korean) / `Corkboard` (English).
- Logged-in members also see a lightweight Corkboard preview card at the top of the main page. It reuses `GET /api/agora/corkboards/current` and computes the visible note count, latest public `OFFICIAL` note preview, and the current member sticker state from the existing note editability flags. The full corkboard UI remains available only on `/corkboard`.

Admin entry point:

- Admin menu `CORKBOARD`
- Available to `SUPER_ADMIN` and `STAFF`.
- The top of the panel shows current period settings, page count, note count, writable state, a super-admin settings form, a super-admin new-board form, and past board navigation.
- The two super-admin forms (`기간 수정` / Edit Period, and `새 보드 생성 / 예약` / Create-Schedule Board) are collapsed on arrival and open one at a time. They are occasional actions, and leaving them open pushed the board itself below the fold. The period metrics above them stay visible, since those are the at-a-glance state rather than an action.
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
- Colours in `src/corkboard.css` follow the `swing.*` palette registered in `tailwind.config.js`, so the board matches the rest of the site. The page background is cream/paper; the cork surface and wood frame keep their original warm browns, which already suited the palette.
- Sticker templates keep their hue. The template labels name the colour (`연한 파랑 메모` / `Blue note`) and the key is persisted in `corkboard_note.sticker_template_key`, so a hue change would make the label wrong and would not match stored rows. Tones are vintage rather than neon; `blue` uses the brand `swing.sky` tone.
- Sticker paper carries the same grain as `.swing-paper` on the public site.
- Templates must stay visually distinct. `white` and `lined` share a near-identical base by design and are told apart by the ruled lines and the coloured margin, not by the base colour.
- Status colours (danger red, success emerald, warning amber) are deliberately not themed anywhere in the Corkboard: they carry meaning rather than brand.
- Notes have slight rotation, shadow, hover lift, selected outline, and attach/land animations.
- The write flow includes template selection, live preview, character count, board tap/drag placement, and submit feedback.
- Owner position editing uses long press, drag, and drop confirmation. There is no separate move button on the public board.
- Owner content editing and soft deletion are available from a small `...` action menu on the user's own visible current-board `MEMBER` notes.
- If a member already has an active sticker for the selected period, the write flow shows a centered replacement confirmation modal before sending `replaceExisting=true`.
- If a member's current-period note is hidden for moderation, the write flow shows a staff-review message and does not allow replacement.
- The admin board has three views, in this order: `메모 모아보기` / Note List, `관리용 보기` / Management View, `보드 미리보기` / Board Preview. It opens on `메모 모아보기`: reading the notes is what the screen is usually opened for, while moving and moderating are deliberate acts and are one tap away.
  - `메모 모아보기` is the notes on their own, sized to be read: sticker template, content, author, date, and a note count. It is deliberately read-only — moderation stays in the management view rather than being spread across two screens that would then have to agree. Hidden notes still appear, badged and dimmed, because admin sees what the public does not.
  - Its grid floor is 140px measured against the panel's content box, not the viewport: a 375px phone leaves about 301px there and fits two columns, a 320px one falls to a single column. `min(100%, 140px)` is what allows that fall instead of a sideways scroll.
  - The view toggle is a wrapping flexbox rather than a fixed column count, so a fourth view would need no CSS change and three Korean labels wrap to a second row on a 320px screen instead of overflowing.
- The admin panel uses compact numeric `positionX`, `positionY`, and `rotationDeg` inputs per note card to keep the management layout operational.
- The admin panel allows inline content editing only for `OFFICIAL` note cards.
- Existing slot-only notes use deterministic fallback coordinates from `slotIndex`.

## QA Status

Feature behaviour last verified: 2026-06-30, local dev environment. The checklist below covers that pass.

Theme/palette last verified: 2026-07-15. That was a colour-only pass and did **not** re-run the behaviour checklist; see "Theme pass" below for what it did and did not cover.

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
- Owner note content editing saves through `PATCH /api/agora/corkboard-notes/{id}/content` and updates the board immediately.
- Owner note deletion uses `DELETE /api/agora/corkboard-notes/{id}` and removes the note from public/admin note responses via soft delete.
- Admin note position editing is available from each admin note card and preserves the list/card management layout.
- Admin `OFFICIAL` note content editing is available from the admin note card. `MEMBER` notes remain moderation-only through hidden/unhidden status.
- Archived boards are read-only.
- Admin Corkboard period settings render on desktop and mobile without horizontal overflow.
- Admin current period info displays `periodKey`, title, start/end dates, status, page count, note count, and writable state.
- Super-admin period controls are visible for the local super admin account.
- Period creation, duplicate rejection, same-period page updates, manual archive, and staff rejection are covered by `CorkboardServiceTest`.

### Theme pass, 2026-07-15

Colour and texture only. No selector, layout, animation, or drag rule changed; `src/corkboard.css` kept 246 selectors, 13 `@keyframes`, and 3 `@media` blocks. The only non-colour edits were the paper-grain layers added to six templates, the `background-size` entry that the extra layer on `pink` requires, and the page-grain spacing (82px to 46px, to match `.swing-paper`).

Checked:

- `/corkboard` renders with the cream/paper page background; the cork surface (`#b87945`) and wood frame (`#855433`) are unchanged.
- All nine sticker templates resolve to their intended colours, and note text stays well above AA on every one (10.4–13.5:1).
- No cold/blue leftovers remain on the page, measured from computed styles rather than by eye.
- No console errors; no horizontal overflow at 390px.
- `npm run build` passes.

Not checked in that pass, and still resting on the 2026-06-30 verification:

- The write flow (template picker, live preview, placement) — it needs a member login.
- Admin Corkboard rendering, including the `.admin-corkboard-*` rules in `src/corkboard.css` that the pass also recoloured — it needs an admin login.
- Note landing, lift, drop, and return animations, and long-press movement. The CSS rules are unchanged, but they were not exercised.

Re-run the relevant checklist items below before trusting the Corkboard after any further styling work.

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
- [x] Can open the `...` menu on own visible current-board member notes.
- [x] Can edit own note content and see it update immediately.
- [x] Can delete own note with confirmation; the note disappears and stays hidden after reload.
- [x] Cannot edit or delete other members' notes, official notes, hidden notes, or archived notes.
- [x] Cannot write to archived boards.

Staff or admin:

- [x] Can access the admin Corkboard menu.
- [x] Can view current and archived corkboards.
- [x] Can create `OFFICIAL` notes from the admin panel.
- [x] Can edit `OFFICIAL` note content from the admin panel.
- [x] Cannot directly edit `MEMBER` note content in admin; uses hidden/unhidden moderation.
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
