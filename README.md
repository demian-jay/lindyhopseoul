# lindyhopseoul

A mobile-first React page for introducing Lindy Hop and the swing dance community in Seoul. The repository now also includes a minimal Spring Boot + MariaDB backend so the app can save and load example memo data.

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

Admin users are stored in `ADMIN_USER_M`, and teacher login users are stored in `TEACHER_USER_M`.
Passwords are stored as salted PBKDF2 hashes, never as plaintext.
Both tables include `LANG_CD` for admin UI language settings. Supported values are `Kor` and `Eng`.
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
5. Open the Vite URL and use the memo section to create, edit, and delete memos.

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

- JPA is configured with `ddl-auto: update` for local development so the `memos` table can be created automatically.
- CORS allows `http://localhost:5173` by default through `APP_CORS_ALLOWED_ORIGINS`.
- The current exception handling returns a small JSON error response for validation failures, missing resources, and unexpected errors.

## Future Work

- Add authentication, login, and authorization.
- Add production-safe secret management.
- Replace `ddl-auto: update` with explicit migrations such as Flyway.
- Add deployment configuration.
- Expand validation and API test coverage.
