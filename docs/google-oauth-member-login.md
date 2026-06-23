# Google OAuth Member Login Notes

Last updated: 2026-06-23

This document captures the current Google OAuth login and automatic member signup state for future user/member-related work.

## Current Status

- Google OAuth login and automatic member creation are implemented in backend and frontend code.
- Logged-in member settings are implemented for nickname and preferred language.
- Backend local port is configured as `18080` for the current Google OAuth client redirect URI.
- Frontend local dev URL is `http://localhost:5173`.
- `VITE_API_BASE_URL` is configured as `http://localhost:18080` in local `.env` and `.env.example`.
- Local `.env` is ignored by Git. `GOOGLE_CLIENT_SECRET` must stay only in ignored local env files or machine environment variables.
- The current Google OAuth start URL has been verified to generate:
  - `client_id=379464115888-9l5qigroaag415hao6nsiurihm6guvd8.apps.googleusercontent.com`
  - `redirect_uri=http://localhost:18080/login/oauth2/code/google`
  - scopes: `openid email profile`
- CORS from `http://localhost:5173` to `http://localhost:18080` has been verified with credentials enabled.
- Backend tests and frontend build have passed.
- Full Google login, `authenticated=true`, and member row creation were verified during OAuth setup.

## Google Cloud Console Settings

OAuth client type: Web application

Authorized JavaScript Origin:

```text
http://localhost:5173
```

Authorized Redirect URI:

```text
http://localhost:18080/login/oauth2/code/google
```

Current local Client ID:

```text
379464115888-9l5qigroaag415hao6nsiurihm6guvd8.apps.googleusercontent.com
```

Never commit the Client Secret.

## Local Environment

Use the repository-root `.env` for local development. It is already listed in `.gitignore`.

Required local values:

```text
SERVER_PORT=18080
VITE_API_BASE_URL=http://localhost:18080
GOOGLE_CLIENT_ID=379464115888-9l5qigroaag415hao6nsiurihm6guvd8.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<local secret only>
GOOGLE_OAUTH_REDIRECT_URI={baseUrl}/login/oauth2/code/{registrationId}
APP_OAUTH2_SUCCESS_REDIRECT_URI=http://localhost:5173/oauth/success
APP_OAUTH2_FAILURE_REDIRECT_URI=http://localhost:5173/oauth/error
APP_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:3000,http://127.0.0.1:3000
```

Backend local profile imports the root env file from:

```text
backend/src/main/resources/application-local.yml
spring.config.import=optional:file:../.env[.properties]
```

If `.env` changes, restart both servers:

```powershell
cd backend
mvn spring-boot:run
```

```powershell
npm run dev -- --host 127.0.0.1
```

## Implemented Backend Flow

Primary files:

- `backend/pom.xml`
- `backend/src/main/resources/application.yml`
- `backend/src/main/resources/application-local.yml`
- `backend/src/main/java/com/lindyhopseoul/backend/config/SecurityConfig.java`
- `backend/src/main/java/com/lindyhopseoul/backend/config/CorsConfig.java`
- `backend/src/main/java/com/lindyhopseoul/backend/auth/*`
- `backend/src/main/java/com/lindyhopseoul/backend/member/*`
- `backend/src/test/java/com/lindyhopseoul/backend/auth/GoogleOAuth2MemberServiceTest.java`
- `backend/src/test/java/com/lindyhopseoul/backend/member/MemberSettingsServiceTest.java`

Flow:

1. User clicks frontend login button.
2. Browser navigates to `http://localhost:18080/oauth2/authorization/google`.
3. Spring Security OAuth2 Client redirects to Google.
4. Google redirects back to `/login/oauth2/code/google`.
5. Success handler calls `GoogleOAuth2MemberService`.
6. Service reads Google `sub`, `email`, and `name` from `OAuth2User` or `OidcUser`.
7. Existing member is looked up by `provider=GOOGLE` and `provider_id=<sub>`.
8. Existing member: update `email`, `display_name`, and `last_login_at`.
9. New member: create role `USER`, status `ACTIVE`.
10. Session stores only internal member id under `AUTHENTICATED_MEMBER_ID`.
11. Success redirects to `APP_OAUTH2_SUCCESS_REDIRECT_URI`.

Important privacy/security behavior:

- Google Access Token is not stored in DB.
- Google Refresh Token is not stored in DB.
- Google profile image is not stored in DB.
- `provider_id` is not returned from `/api/auth/me`.
- API response includes only `authenticated`, `memberId`, `email`, `displayName`, `nickname`, `preferredLanguage`, and `role`.
- `NoopOAuth2AuthorizedClientRepository` prevents Spring's authorized client from being saved in the session.

## Member Table

Table name:

```text
member
```

Current intended columns:

```text
id
provider
provider_id
email
display_name
nickname
preferred_language
role
status
created_at
updated_at
last_login_at
```

Unique constraint:

```text
uk_member_provider_provider_id(provider, provider_id)
```

Do not add these columns unless a future feature has a clear reason:

```text
access_token
refresh_token
profile_image_url
phone
address
birth_date
gender
```

Member settings columns:

- `nickname`: nullable, stored only after trimming, 2 to 20 characters when present. Duplicate nicknames are currently allowed.
- `preferred_language`: defaults to `KO`; valid values are `KO` and `EN`.

## Frontend Flow

Primary files:

- `src/api/auth.js`
- `src/App.jsx`

Behavior:

- A small fixed login button is displayed at the top-right of the public page.
- On mount, frontend calls `GET /api/auth/me` with `credentials: "include"`.
- Logged-out state shows `Sign in with Google`.
- Login click navigates to `${VITE_API_BASE_URL}/oauth2/authorization/google`.
- Logged-in state shows `Settings`, `Logout`, and, on larger screens, the nickname, display name, or email.
- Logout calls `POST /api/auth/logout` with `credentials: "include"`.
- `/settings` shows the logged-in member settings form:
  - read-only email
  - read-only Google display name
  - editable nickname
  - preferred language select with `KO` and `EN`
  - save success/error feedback

## API Contract

Logged out:

```json
{
  "authenticated": false
}
```

Logged in:

```json
{
  "authenticated": true,
  "memberId": 1,
  "email": "user@example.com",
  "displayName": "User Name",
  "nickname": "Jay",
  "preferredLanguage": "KO",
  "role": "USER"
}
```

No token, refresh token, or `provider_id` should be exposed in API responses.

Member settings:

```http
GET /api/members/me/settings
PATCH /api/members/me/settings
```

PATCH request:

```json
{
  "nickname": "Jay",
  "preferredLanguage": "EN"
}
```

Unauthenticated requests return `401`. Invalid nickname or preferred language values return `400`.

## Verified So Far

Commands:

```powershell
cd backend
mvn test
```

Result: passed, 42 tests.

```powershell
npm run build
```

Result: passed.

Manual/local checks already performed:

- `.env` is ignored by Git.
- `GOOGLE_CLIENT_SECRET` was confirmed to be present in local `.env` without printing the value.
- Backend starts on `18080`.
- `GET http://localhost:18080/api/auth/me` returns `authenticated=false` before login.
- OAuth start URL redirects to Google with `redirect_uri=http://localhost:18080/login/oauth2/code/google`.
- CORS response from `Origin: http://localhost:5173` includes `Access-Control-Allow-Credentials: true`.
- Vite dev server injects `VITE_API_BASE_URL=http://localhost:18080`.
- `member` table has the expected unique index and no token/profile image columns.

## Still To Verify

The browser automation tool was unavailable due to a Windows sandbox process error, so the actual Google account interaction needs manual browser login.

Manual verification checklist:

1. Open `http://localhost:5173`.
2. Click the top-right `Sign in with Google` button.
3. Complete Google login in the browser.
4. Confirm redirect back to React page.
5. Confirm `GET http://localhost:18080/api/auth/me` returns `authenticated=true`.
6. Confirm the top-right button changes to a logged-in or `Logout` state.
7. Check `member` row:
   - one row created for a new Google account
   - `provider=GOOGLE`
   - `provider_id` is Google `sub`
   - `email` and `display_name` saved
   - `role=USER`
   - `status=ACTIVE`
   - `last_login_at` saved
8. Log out.
9. Confirm `/api/auth/me` returns `authenticated=false`.
10. Log in again with the same Google account.
11. Confirm no duplicate member row is created.
12. Review backend logs for absence of:
   - Access Token
   - Refresh Token
   - Client Secret
   - unnecessary personal information

Useful DB checks:

```powershell
docker exec lindyhopseoul-mariadb mariadb -ulindyhop_dev -plindyhop_dev_password lindyhopseoul -e "SELECT id, provider, LEFT(provider_id, 8) AS provider_id_prefix, email, display_name, role, status, created_at, updated_at, last_login_at FROM member ORDER BY id DESC LIMIT 5;"
```

```powershell
docker exec lindyhopseoul-mariadb mariadb -ulindyhop_dev -plindyhop_dev_password lindyhopseoul -e "SHOW COLUMNS FROM member LIKE '%token%'; SHOW COLUMNS FROM member LIKE '%image%'; SHOW COLUMNS FROM member LIKE '%profile%'; SHOW INDEX FROM member WHERE Key_name='uk_member_provider_provider_id';"
```

## Known Gotchas

- `redirect_uri_mismatch` means Google Cloud Console and Spring Boot redirect URI differ. For current local testing, both must be `http://localhost:18080/login/oauth2/code/google`.
- If `/api/auth/me` stays false after login, check session cookie, CORS credentials, and whether frontend is really using `VITE_API_BASE_URL=http://localhost:18080`.
- If login succeeds but no member row is created, check `OAuth2LoginSuccessHandler` and `GoogleOAuth2MemberService`.
- If duplicate members are created, verify `provider_id` comes from Google `sub` and the unique constraint exists.
- If `.env` changes, restart Vite. Vite does not reliably pick up env file changes without a restart.
