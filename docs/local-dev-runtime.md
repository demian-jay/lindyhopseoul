# Local Dev Runtime Ports

This file is the local runtime note to check before starting or restarting dev servers.

Last updated: 2026-07-27

## Source of Truth

Local ports are defined in the repository-root `.env`.

Current local OAuth setup expects the backend on `18080`, not `8080`.

## Current Local Ports

- Frontend Vite: `http://localhost:5173`
- Backend Spring Boot API: `http://localhost:18080`
- MariaDB Docker port: `127.0.0.1:3307`

## Login and OAuth

- Frontend login uses `VITE_API_BASE_URL`.
- Current local value: `http://localhost:18080`
- Google OAuth start URL: `http://localhost:18080/oauth2/authorization/google`
- Google OAuth callback URL expected for local testing: `http://localhost:18080/login/oauth2/code/google`
- OAuth success redirects back to `http://localhost:5173/oauth/success`

## Local Admin Token

`DevAdminSessionBootstrap` issues a session for the `admin` account on every
local start and prints it, so local admin work needs no password typed in. It
carries `@Profile("local")`, so the bean is never created on the `prod` profile
— `DevAdminSessionBootstrapTest` is what holds that. The token is generated
fresh each start and only ever written to the log; nothing is hard-coded,
because this repository is public.

Read it out of the backend log:

```powershell
Select-String -Path backend\backend-dev.log -Pattern "Authorization: Bearer" | Select-Object -Last 1
```

Then either call the API with it:

```bash
curl -s -H "Authorization: Bearer <token>" http://localhost:18080/api/admin/auth/me
```

or sign the admin UI in by putting it where the app looks:

```js
localStorage.setItem('swingpop-admin-token', '<token>')  // then reload /admin
```

It is an ordinary session, not a bypass of the checks: roles, account status and
a pending password change are still read off the account on every request.

### On a new machine, sign in once first

Nothing else has to be set up — the `local` profile is the default,
`application-local.yml` carries the database defaults, and `AdminBootstrap`
seeds the `admin` account into an empty database. One step is still manual.

`UserAccount.create` does not set `pwdChangedAt`, so a freshly seeded `admin`
reports `mustChangePassword`, and `AdminApiAuthInterceptor` answers
`403 PASSWORD_CHANGE_REQUIRED` to every route except `/api/admin/auth/me` and
`/api/admin/auth/me/password` — the dev token included. It is not silent; the
startup log says so next to the token.

Sign in to the admin UI once and set a password, and the token works from then
on. The seed password is `ADMIN_INITIAL_PASSWORD` from `.env` if it is set, and
otherwise a random one logged once while the account is created (`.env` is
gitignored, so a new machine usually has neither until someone sets it).

Doing this per machine is deliberate. Clearing the pending flag from the
bootstrap would remove a real control on the local profile rather than skip the
password prompt, and would leave no way to exercise the password-change flow
locally.

## Restart Checklist

Before starting processes:

1. Read this file and `.env`.
2. Check current listeners:
   - `netstat -ano | findstr 5173`
   - `netstat -ano | findstr 18080`
   - `netstat -ano | findstr 3307`
3. Stop only this workspace's stale Vite/Spring Boot processes.
4. Start Vite on `5173`.
5. Start Spring Boot using `.env` defaults, so it runs on `18080`.
6. Verify:
   - `http://localhost:5173/corkboard`
   - `http://localhost:18080/api/agora/corkboards/current`

You can start both dev processes with:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-local-dev.ps1
```

## Notes

Do not switch the backend to `8080` for local OAuth testing unless the `.env`, frontend `VITE_API_BASE_URL`, and Google OAuth redirect URI are changed together.
