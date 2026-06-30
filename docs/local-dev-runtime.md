# Local Dev Runtime Ports

This file is the local runtime note to check before starting or restarting dev servers.

Last updated: 2026-06-29

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
