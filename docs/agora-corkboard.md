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
  - `hidden`
  - `author_nickname_snapshot`
  - `author_name_snapshot`
  - `created_at`
  - `updated_at`

`corkboard.period_key + page_no` is unique. `corkboard_note.board_id + slot_index` is unique.

## Periods and Pages

The service uses the current date in `Asia/Seoul` to derive the active monthly `periodKey`.

There is no scheduler. On current-board reads and note creation, the service:

1. Archives older active boards.
2. Creates the current month board if it does not exist.
3. Adds new notes to the first active board page with a free slot.
4. Creates the next page automatically when all 18 slots are occupied.

Past boards are read-only.

## Validation and Permissions

Public users:

- Can read the current board.
- Can read archived boards.
- Cannot write.

Logged-in members:

- Can create `MEMBER` notes only on the current active board.
- Cannot edit or delete notes in this MVP.

Staff and super admins:

- Can create `OFFICIAL` notes through the admin panel.
- Can hide or unhide any note.
- Can view current and past boards, including hidden notes.

Content rules:

- Server trims `content`.
- Blank content is rejected.
- Max content length is 200 characters.
- Author snapshots are taken from the server-side member/admin session, never from the client.
- Public responses exclude `hidden=true` notes.
- React renders note content as text, so HTML/script input is not executed.

## APIs

Public:

- `GET /api/agora/corkboards/current`
- `GET /api/agora/corkboards/archive`
- `GET /api/agora/corkboards?periodKey=YYYY-MM`
- `POST /api/agora/corkboard-notes`

Admin:

- `GET /api/admin/agora/corkboards`
- `GET /api/admin/agora/corkboards?periodKey=YYYY-MM`
- `POST /api/admin/agora/corkboard-notes`
- `PATCH /api/admin/agora/corkboard-notes/{id}/hidden`

## Frontend

User entry point:

- `/corkboard`
- Also linked from the main hero as `Agora Corkboard`.

Admin entry point:

- Admin menu `CORKBOARD`
- Available to `SUPER_ADMIN` and `STAFF`.

Main files:

- `src/CorkboardPage.jsx`
- `src/AdminCorkboardPanel.jsx`
- `src/corkboard.css`
- `src/api/corkboards.js`
- `src/api/admin.js`

Design notes:

- The board uses CSS cork texture, wood frame, shadows, and fixed slots.
- Desktop uses an 18-slot corkboard grid.
- Mobile collapses to a stable single-column board/list hybrid.
- Note templates include yellow, pink, blue, white, lined, tape, pin, and staff notice styles.
- Notes have slight rotation, shadow, hover lift, selected outline, and attach/land animations.
- The write flow includes template selection, live preview, character count, and submit feedback.

## QA Status

Last verified: 2026-06-29, local dev environment.

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
- Archived boards are read-only.

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
- [x] Can enter up to 200 characters and see the remaining count.
- [x] Cannot submit blank content.
- [x] Creates `MEMBER` notes using the server-side member session.
- [x] Sees the newly added note land on the active board.
- [x] Cannot write to archived boards.
- [x] Cannot edit or delete notes in this MVP.

Staff or admin:

- [x] Can access the admin Corkboard menu.
- [x] Can view current and archived corkboards.
- [x] Can create `OFFICIAL` notes from the admin panel.
- [x] Official notes are visually emphasized without looking like a rigid notice board.
- [x] Can hide and unhide notes.
- [x] Hidden notes are still available in the admin view.
- [x] Hidden notes are excluded from public user responses.

## Deferred

The MVP intentionally excludes:

- Drag and drop positioning.
- Resizing notes.
- Image uploads.
- Rich text.
- Comments.
- Likes.
- Realtime updates.
