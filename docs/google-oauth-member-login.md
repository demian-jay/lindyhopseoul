# Google OAuth Member Login Notes

Last updated: 2026-06-25

This document captures the current Google OAuth login and automatic member signup state for future user/member-related work.

## Current Status

- Google OAuth login and automatic member creation are implemented in backend and frontend code.
- Logged-in member settings are implemented for nickname and preferred language.
- Google login now passes through a lightweight privacy confirmation page before redirecting to Google OAuth.
- The `/privacy` 개인정보처리방침 page is available from the privacy confirmation and member account screens without showing a persistent top-page notice.
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
10. Session stores only internal member id under `AUTHENTICATED_MEMBER_ID`. The
    success handler removes the `SPRING_SECURITY_CONTEXT` attribute Spring
    Security had just written, so the OIDC principal — ID token, claims, profile
    image URL — is not what ends up in the session row.
11. Success redirects to `APP_OAUTH2_SUCCESS_REDIRECT_URI`.

## Session Lifetime

Member sessions are stored in the database by Spring Session JDBC
(`SPRING_SESSION`, `SPRING_SESSION_ATTRIBUTES`), not in Tomcat's memory, so a
backend restart does not sign members out.

- `server.servlet.session.timeout` is 90 days and slides: every request pushes
  the expiry out again.
- `server.servlet.session.cookie.max-age` is also 90 days, but it is written
  once at sign-in rather than re-issued per request. A member who is active
  right up to day 90 is still asked to sign in again then.
- The cookie is named `SESSION` (Spring Session's default), not `JSESSIONID`.

Both are overridable per environment through `SESSION_TIMEOUT` and
`SESSION_COOKIE_MAX_AGE`.

The long window is deliberate: the site is installed as a phone app, where being
signed out reads as the app being broken rather than as a session ending. It is
also why the OIDC principal is dropped — a 90-day row should not be 90 days of
Google identity data at rest.

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
- Logged-out state does not show a persistent privacy notice in the fixed top login control.
- Login click navigates to `/login`, where the user must check the privacy confirmation before continuing.
- After confirmation, the frontend navigates to `${VITE_API_BASE_URL}/oauth2/authorization/google`.
- Logged-in state shows `Settings`, `Logout`, and, on larger screens, the nickname, display name, or email.
- My Page includes a small `/privacy` link for logged-in members.
- My Settings includes a small `/privacy` link so members can review the policy while setting up account information.
- `/privacy` includes Korean and English policy views with an in-page language switcher.
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

## Staff Signing In With Google

Landed 2026-08-19, both sides.

Staff who already registered as ordinary members with Google can reach the admin
app with that account, once a super admin has paired the two rows. The pairing is
explicit and never inferred from a matching email — a Google address can be given
up and handed to someone else, and an admin account is worth more than a string
it happens to share.

| Piece | Where |
| --- | --- |
| The link | `USER_M.MEMBER_ID`, nullable, unique |
| Sign-in exchange | `POST /api/admin/auth/google` → `AdminGoogleSignInService` |
| Managing links | `/api/admin/google-links`, `AdminGoogleLinkService`, super admin only |
| Sign-in button | `LoginScreen` in `src/AdminApp.jsx` |
| Linking screen | 설정 › 구글 계정 연동, `src/AdminGoogleLinkPanel.jsx`, menu `GOOGLE_LINKS` |

The exchange reads the **member** session cookie on the request and answers with
the same `AdminAuthResponse` a password sign-in returns, so the admin app stores
the token exactly as it already does and its auto-login keeps working unchanged.
It sits in `AdminApiAuthInterceptor`'s anonymous allowlist because it is a way in
and cannot require the token it hands out — the member cookie is its credential.

What it refuses, all with one message so a caller cannot probe which case it hit:
a member who is not `ACTIVE` (withdrawal keeps the row, so a link made earlier
still points at it), a member no account is linked to, and a deactivated admin
account.

`mustChangePassword` is deliberately **not** bypassed. Arriving by Google is a
second door into the account, not a way past the controls on it, so an account
that still owes a password change is held at the password screen either way.

### The cross-host part, which is the one that bites

The member session cookie sets no `Domain`, so it is host-only. The members app
is `swingpopseoul.com` and the admin app is `admin.swingpopseoul.com`, which
means a member session established on the members site is **not** sent to the
admin host and the exchange will answer 401 there.

The chosen fix is for the admin host to run its own OAuth round trip rather than
widen the cookie. That needs, before this works in production:

- `https://admin.swingpopseoul.com/login/oauth2/code/google` added to the Google
  Cloud Console authorised redirect URIs
- `admin.swingpopseoul.com` added to `APP_OAUTH2_ALLOWED_REDIRECT_HOSTS` in
  `/etc/lindyhop/backend.env`

Neither is in this repository, so neither fails a build or a test. Locally
everything runs on one origin, so local testing passes without them and tells you
nothing about production.

`ddl-auto: update` adds `MEMBER_ID` and its unique constraint on its own —
verified against MariaDB on 2026-08-19, index `UK_USER_M_MEMBER_ID`. Existing
rows are no obstacle: MariaDB permits many NULLs in a unique index.

### Turning it on in production

Not done yet as of 2026-08-19. Three things have to change, none of which lives
in this repository, so nothing here fails while they are missing — the button
simply answers 401 on the admin host.

Start by finding out how much is actually needed. All read-only:

```bash
for U in "https://admin.swingpopseoul.com/oauth2/authorization/google" \
         "https://admin.swingpopseoul.com/oauth/success" \
         "https://admin.swingpopseoul.com/api/agora/corkboards/current"; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' "$U")  $U"
done
```

The first should be `302` to accounts.google.com and the second `200`. A `404`
on either means nginx step below is still required.

**1. Google Cloud Console.** Add
`https://admin.swingpopseoul.com/login/oauth2/code/google` to the authorised
redirect URIs, leaving the members one in place. No JavaScript origin is needed;
this is a server-side flow.

**2. `/etc/lindyhop/backend.env`.** Add `admin.swingpopseoul.com` to
`APP_OAUTH2_ALLOWED_REDIRECT_HOSTS` — `OAuth2RedirectResolver` consults it to
decide whether to return the sign-in to the host it started from, and without it
the return goes to the members host, whose cookie the admin host cannot read.

Check `GOOGLE_OAUTH_REDIRECT_URI` in the same file while you are there. It must
be the template `{baseUrl}/login/oauth2/code/{registrationId}`, or absent. Set to
an absolute members-host URL it would send Google that URL no matter which host
the sign-in began on, so the cookie lands on the wrong host and the feature fails
quietly, with everything else still working.

**3. The admin host's nginx.** `/etc/nginx/default.d/lindyhop.conf` proxies
`/api/`, `/oauth2/` and `/login/oauth2/`, but the admin host has never run an
OAuth round trip, so confirm its server block carries the last two as well as
`/api/`, and that `/oauth/success` falls back to `admin.html` the way `/` does:

```bash
ssh ec2-user@52.78.185.32 'sudo nginx -T | grep -n "server_name admin" -A 40'
```

**Deploy the backend first, then the frontend.** That is the opposite of the
2026-07-20 rule, and for the opposite reason: nothing here makes the backend
refuse what the current frontend needs, so a new backend under an old frontend
is simply an endpoint nobody calls, while a new frontend under an old backend
shows staff a button that 404s.

Verify the redirect actually names the admin host:

```bash
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" \
  "https://admin.swingpopseoul.com/oauth2/authorization/google"
```

The `redirect_uri` inside that location must be the admin host. If it names the
members host, `GOOGLE_OAUTH_REDIRECT_URI` is the absolute-URL case above.

### The button, and why it does not sign anyone in by itself

The exchange runs only when someone presses the button, never on load. A member
session plus an automatic exchange would mean any unlocked phone signed in to the
members site was also signed in to admin, which is not what linking an account is
meant to buy.

Pressing it tries the exchange first, in case a member session is already on this
origin, and only sends the browser to Google when there is none. Before leaving it
records `swingpop-admin-google-return` in `sessionStorage`, holding the path to
come back to; `src/main.jsx` reads it and puts the path back before React renders,
because Google returns to `/oauth/success` — the members app's route. On the admin
host that is harmless, since the whole origin is the admin app, but local dev
serves both from `localhost:5173` and would otherwise land on the public site.
`LoginScreen` clears the flag as it resumes, so a failed exchange leaves the
screen idle rather than bouncing to Google on every reload.

Local testing therefore needs Vite on **5173**, not another port:
`APP_OAUTH2_SUCCESS_REDIRECT_URI` in `.env` names it, and a mismatch sends the
return trip to an origin with nothing listening. `.claude/launch.json` was moved
to 5173 for this on 2026-08-19.

## Known Gotchas

- `redirect_uri_mismatch` means Google Cloud Console and Spring Boot redirect URI differ. For current local testing, both must be `http://localhost:18080/login/oauth2/code/google`.
- A staff Google sign-in that answers 401 on the admin host, while the same account works on the members host, is the host-only session cookie above — not a broken link row.
- If `/api/auth/me` stays false after login, check session cookie, CORS credentials, and whether frontend is really using `VITE_API_BASE_URL=http://localhost:18080`.
- If login succeeds but no member row is created, check `OAuth2LoginSuccessHandler` and `GoogleOAuth2MemberService`.
- If duplicate members are created, verify `provider_id` comes from Google `sub` and the unique constraint exists.
- If `.env` changes, restart Vite. Vite does not reliably pick up env file changes without a restart.
- Re-registering with the same Google account after member withdrawal may still be blocked by the existing withdrawal/restricted-account policy. Use a fresh Google account or reset local test data when verifying first-time automatic member creation.
