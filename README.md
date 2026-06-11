# lindyhopseoul

A mobile-first React page for introducing Lindy Hop and the swing dance community in Seoul. The repository now also includes a Spring Boot + MariaDB backend for memo examples, admin login, SwingPop operations manual management, and event/lesson operations.

## Project Structure

```text
.
├─ src/                 # Existing Vite + React frontend
├─ public/              # Static frontend assets
├─ backend/             # Spring Boot API server
├─ docker-compose.yml   # Local MariaDB for development
├─ .env.example         # Local environment variable template
└─ package.json         # Frontend scripts
```

The frontend remains at the repository root. The backend is isolated in `backend/` so both apps can be managed together without turning the current React project into a larger monorepo setup too early.

## Version Choices

- Frontend: existing React 18, Vite 5, Tailwind CSS setup was kept to avoid unnecessary migration work.
- Backend: Spring Boot 4.0.6 with Java 21 LTS and Maven. Spring Boot 4.0.6 is the current stable line in the official docs, and Java 21 is a stable LTS choice while Spring Boot requires Java 17+. See [Spring Boot system requirements](https://docs.spring.io/spring-boot/system-requirements.html).
- Build tool: Maven 3.6.3 or later, matching Spring Boot's documented Maven support.
- Database: MariaDB 11.8 LTS Docker image for local development. See the [MariaDB Docker Official Image](https://hub.docker.com/_/mariadb).
- JDBC driver: MariaDB Connector/J 3.5.8, a stable release listed by MariaDB. See [Connector/J releases](https://mariadb.org/connector-java/all-releases/).

## API

The backend exposes a simple memo CRUD API:

```text
GET    /api/memos
GET    /api/memos/{id}
POST   /api/memos
PUT    /api/memos/{id}
DELETE /api/memos/{id}
```

The backend also exposes admin authentication and account-management APIs:

```text
POST   /api/admin/auth/login
GET    /api/admin/auth/me
POST   /api/admin/auth/logout
GET    /api/admin/users/admins
POST   /api/admin/users/admins
PUT    /api/admin/users/admins/{adminUserCd}
PATCH  /api/admin/users/admins/{adminUserCd}/deactivate
GET    /api/admin/users/teachers
POST   /api/admin/users/teachers
PUT    /api/admin/users/teachers/{teacherUserCd}
PATCH  /api/admin/users/teachers/{teacherUserCd}/deactivate
```

Login accounts are stored in `USER_M`, and roles are stored in `USER_ROLE_M`.
One user account can have multiple roles, such as `STAFF` and `TEACHER`.
The login and `me` responses include both a compatibility `role` field and the canonical `roles` array:

```json
{
  "user": {
    "userId": "10",
    "name": "Hernan",
    "loginId": "hernan",
    "role": "STAFF",
    "roles": ["STAFF", "TEACHER"]
  }
}
```

`TEACHER_USER_M` is used as a teacher profile table, not as a separate login table.
Teacher profiles link back to `USER_M.USER_ID`, and teacher dashboard queries resolve lessons through `USER_M -> TEACHER_USER_M -> LESSON_TEACHER`.

The admin operations manual is implemented with the code/domain name `KnowledgeBase`:

```text
GET    /api/admin/knowledge-base/bootstrap
GET    /api/admin/knowledge-categories
POST   /api/admin/knowledge-categories
PUT    /api/admin/knowledge-categories/{id}
DELETE /api/admin/knowledge-categories/{id}
GET    /api/admin/knowledge-items
GET    /api/admin/knowledge-items/{id}
POST   /api/admin/knowledge-items
PUT    /api/admin/knowledge-items/{id}
DELETE /api/admin/knowledge-items/{id}
```

`GET /api/admin/knowledge-base/bootstrap` returns the data needed by the operations manual screen in one response, including all supported translations:

```json
{
  "defaultLanguage": "ko",
  "supportedLanguages": ["ko", "en"],
  "categories": [
    {
      "id": 1,
      "displayOrder": 10,
      "translations": {
        "ko": {
          "name": "수업 정책",
          "description": "수업 가격, 수강 기준, 레벨 이동 규칙"
        },
        "en": {
          "name": "Class Policy",
          "description": "Class prices, attendance rules, and level-up policies"
        }
      }
    }
  ],
  "items": [
    {
      "id": 1,
      "categoryId": 1,
      "status": "PUBLISHED",
      "translations": {
        "ko": {
          "title": "Level 1 수업 가격",
          "summary": "Level 1 4주 수업료 및 댄스홀 입장료 안내",
          "content": "Level 1 수업은 4주 과정이며...",
          "tags": ["level1", "가격", "수업료"]
        },
        "en": {
          "title": "Level 1 Class Price",
          "summary": "Information about the 4-week Level 1 class fee and dance hall entrance fee",
          "content": "The Level 1 class is a 4-week course...",
          "tags": ["level1", "price", "class fee"]
        }
      }
    }
  ]
}
```

By default, bootstrap returns only `PUBLISHED` knowledge items. The React admin screen loads this bootstrap payload once when the page opens, then filters in browser JavaScript by category, title, summary, content, and tags without calling the server on every search keystroke.
Search covers all translations, so Korean and English terms can find the same rule. Display falls back to `ko` when a selected translation is missing.

SwingPop event and lesson management is available through the admin API:

```text
GET    /api/admin/teachers/active
GET    /api/admin/events?from=yyyy-MM-dd&to=yyyy-MM-dd&eventType=PARTY&status=PUBLISHED
GET    /api/admin/events/{eventId}
POST   /api/admin/events
PUT    /api/admin/events/{eventId}
DELETE /api/admin/events/{eventId}
GET    /api/admin/events/{eventId}/lessons
POST   /api/admin/events/{eventId}/lessons
PUT    /api/admin/lessons/{lessonId}
DELETE /api/admin/lessons/{lessonId}
GET    /api/admin/message-templates
GET    /api/admin/message-templates/{templateId}
POST   /api/admin/message-templates
PUT    /api/admin/message-templates/{templateId}
DELETE /api/admin/message-templates/{templateId}
POST   /api/admin/message-templates/{templateId}/render
GET    /api/teacher/dashboard
GET    /api/teacher/dashboard/active-lessons
GET    /api/teacher/dashboard/my-lessons?from=yyyy-MM-dd&to=yyyy-MM-dd
```

Event and lesson display text is multilingual. `EventTranslation` stores `title`, `shortDescription`, and `description`; `LessonTranslation` stores `title` and `description`.
The supported language codes are `ko` and `en`. Admin forms capture Korean and English text separately.
Events store `startDate` and `endDate`. Single-day events store the same date in both fields.
Lessons store `scheduleType`, `startDate`, and `endDate`; `SINGLE_DAY` lessons store the same date in both fields, while `PERIOD` lessons can span multiple dates.
The teacher dashboard returns `PUBLISHED` lessons assigned to the logged-in teacher where `lesson.endDate >= today`, with `lessonDisplayStatus` calculated as `UPCOMING`, `ACTIVE`, or `ENDED`. The default dashboard excludes ended lessons.
Supported `EventType` values are `REGULAR_CLASS`, `PARTY`, and `DIALOGUE_PARTY`. The admin UI displays them as Regular Class / 정규수업, Party / 파티, and Dialogue Party / Dialogue 파티.

Lesson teachers are linked to `TEACHER_USER_M` through `LESSON_TEACHER.TEACHER_USER_ID`.
Only teachers with `TEACHER_USER_M.USE_YN = 'Y'` can be assigned to a lesson. Lesson create/update requests fail when a missing or inactive teacher ID is included.

Event permissions:

```text
SUPER_ADMIN: event/lesson create, update, delete; message template create, update, delete; promotion render
STAFF:       event/lesson create, update; promotion render
TEACHER:     own lesson dashboard
MEMBER:      reserved for future member-facing features
```

Message template render requests accept `eventId` and `languageCode`, then return `renderedText`.
Available template variables:

```text
{{event.title.ko}}
{{event.title.en}}
{{event.shortDescription.ko}}
{{event.shortDescription.en}}
{{event.description.ko}}
{{event.description.en}}
{{event.date}}
{{event.startDate}}
{{event.endDate}}
{{event.startTime}}
{{event.endTime}}
{{event.location}}
{{lessons.all.ko}}
{{lessons.all.en}}
{{lessons.level1.title.ko}}
{{lessons.level1.title.en}}
{{lessons.level1.time}}
{{lessons.level1.fee}}
{{lessons.level1.teachers}}
{{lessons.level2.title.ko}}
{{lessons.level2.title.en}}
{{lessons.level2.time}}
{{lessons.level2.fee}}
{{lessons.level2.teachers}}
{{lessons.level3.title.ko}}
{{lessons.level3.title.en}}
{{lessons.level3.time}}
{{lessons.level3.fee}}
{{lessons.level3.teachers}}
{{lessons.level4.title.ko}}
{{lessons.level4.title.en}}
{{lessons.level4.time}}
{{lessons.level4.fee}}
{{lessons.level4.teachers}}
{{lessons.workshop.title.ko}}
{{lessons.workshop.title.en}}
{{lessons.workshop.time}}
{{lessons.workshop.fee}}
{{lessons.workshop.teachers}}
{{lessons.experience.title.ko}}
{{lessons.experience.title.en}}
{{lessons.experience.time}}
{{lessons.experience.fee}}
{{lessons.experience.teachers}}
```

When multiple lessons match the same lesson-type variable, rendered values are joined with line breaks.

Login users are stored in `USER_M`, and each user's roles are stored in `USER_ROLE_M`.
Passwords are stored as salted PBKDF2 hashes, never as plaintext.
Legacy `ADMIN_USER_M` rows are migrated into `USER_M` on backend startup.
`TEACHER_USER_M` stores teacher profiles and links to `USER_M.USER_ID`; legacy teacher-login rows are migrated into linked user accounts on startup.
`USER_M` includes `LANG_CD` for admin UI language settings. Supported values are `Kor` and `Eng`.
When the backend starts, it seeds the first super administrator if missing:

```text
id:       admin
password: 1234
```

The admin UI is intentionally hidden from the public page navigation. Open it directly at:

```text
http://localhost:5173/admin
```

Admin UI internationalization guidelines are documented in `docs/admin-i18n.md`.

The operations manual is available from the admin sidebar as `운영 매뉴얼` / `Operations Manual`.
Initial sample categories include class policy, level rules, staff work, teacher work, curriculum, venue rules, party operations, and partnerships.
Initial sample documents include Level 1 pricing, Level 2 promotion criteria, staff responsibilities, teacher class preparation, Level 1 curriculum content, and dance hall entrance fee policy. Samples include both Korean and English translations.

Event sample data includes:

- 스윙팝 토요 정규수업 / Swingpop Saturday Regular Class
- 스윙팝 11주년 파티 / Swingpop 11th Anniversary Party
- Dialogue 소셜댄스 / Dialogue Social Dance
- Level 1 Beginner Class
- Level 2 Class
- Charleston Workshop
- Beginner Taster Class
- 스윙댄스 체험수업 / Swing Dance Trial Class
- 파티 홍보글 초안
- 정규수업 홍보글 초안
- 강습 안내글 초안

Example request body:

```json
{
  "title": "Practice note",
  "content": "Remember the swing-out timing."
}
```

## Local Environment

Create a local `.env` from the template:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

The checked-in values are development-only defaults. Do not use them for production.

## Run MariaDB

```bash
docker compose up -d mariadb
```

This starts MariaDB on `localhost:3307` with:

```text
database: lindyhopseoul
user:     lindyhop_dev
password: lindyhop_dev_password
```

## Run Backend

Requirements: JDK 21 and Maven 3.6.3+.

```bash
cd backend
mvn spring-boot:run
```

The local profile is enabled by default and connects to `jdbc:mariadb://127.0.0.1:3307/lindyhopseoul`. If you change DB values, set matching `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` environment variables before starting the backend.

## Run Frontend

```bash
npm install
npm run dev
```

Vite reads `VITE_API_BASE_URL` from `.env`. The default API base URL is `http://localhost:8080`.

## Full Local Development Order

1. Copy `.env.example` to `.env`.
2. Start MariaDB: `docker compose up -d mariadb`.
3. Start the backend from `backend/`: `mvn spring-boot:run`.
4. Start the frontend from the repository root: `npm run dev`.
5. Open the Vite URL and use the memo section, or open `/admin` and log in with the seeded admin account.

## Build And Test

Frontend:

```bash
npm run build
```

Backend:

```bash
cd backend
mvn test
```

## Backend Notes

- JPA is configured with `ddl-auto: update` for local development so tables such as `memos`, `USER_M`, `USER_ROLE_M`, `ADMIN_USER_M`, `TEACHER_USER_M`, `KNOWLEDGE_CATEGORY`, `KNOWLEDGE_CATEGORY_TRANSLATION`, `KNOWLEDGE_ITEM`, `KNOWLEDGE_ITEM_TRANSLATION`, `SWINGPOP_EVENT`, `SWINGPOP_EVENT_TRANSLATION`, `LESSON`, `LESSON_TRANSLATION`, `LESSON_TEACHER`, and `MESSAGE_TEMPLATE` can be created automatically.
- CORS allows local Vite origins `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:5174`, and `http://127.0.0.1:5174` by default through `APP_CORS_ALLOWED_ORIGINS`.
- The current exception handling returns a small JSON error response for validation failures, missing resources, and unexpected errors.
- KnowledgeBase sample data is seeded only when no knowledge categories exist.
- Event/lesson sample data is seeded only when no events exist. Message template sample data is seeded only when no message templates exist.
- If no active teacher exists, local seed data creates `teacher1 / 1234` and `teacher2 / 1234` sample teacher accounts.

## Future Work

- Add production-safe secret management.
- Replace `ddl-auto: update` with explicit migrations such as Flyway.
- Add member signup and member username/password login.
- Add Kakao and Google social signup/login.
- Add lesson enrollment, manual participant registration, and payment status management.
- Add teacher participant list views backed by a future `LessonParticipant` or `LessonEnrollment` table.
- Add calendar views for events and lessons.
- Add external public event pages.
- Add deployment configuration.
- Expand validation and API test coverage.
