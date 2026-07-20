# Production Deployment

This file is the note to check before deploying to `lindyhopseoul.com`.

Last updated: 2026-07-20

Deployment is manual. There is no CI/CD, `Dockerfile`, or deploy script in this
repository; every step below is run by hand.

## Current Production

- Site: `https://lindyhopseoul.com` and `https://swingpopseoul.com` (both with
  `www.`), all four served from the same host
- Host: `ec2-user@52.78.185.32`, Amazon Linux 2023, `ap-northeast-2`
- `sudo` on the host is `NOPASSWD`
- HTTPS via Certbot (`/etc/letsencrypt/live/lindyhopseoul.com/`)

SSH accepts `publickey` only. Any key works once it is in
`~ec2-user/.ssh/authorized_keys`; a key the host has never seen fails with
`Permission denied (publickey,...)`, which means the key is not authorised, not
that the host is down.

### Host address, verified 2026-07-20

The address moved to `52.78.185.32` from `54.116.169.23`, which is now
unreachable. Checked on the new address:

| Check | Result |
| --- | --- |
| `A` record for both domains | `52.78.185.32` |
| Reverse DNS | `ec2-52-78-185-32.ap-northeast-2.compute.amazonaws.com` |
| `/` and `/api/agora/corkboards/current` (via `curl --resolve`, so DNS is not trusted) | `200` from `52.78.185.32` |
| TLS certificate | `CN=lindyhopseoul.com`, Let's Encrypt, SAN covers all four names, expires 2026-10-17 |
| SSH port 22 | Open, daemon responds |
| `ssh ec2-user@52.78.185.32` | Shell reached, `sudo` works, a full frontend deploy ran end to end |

Everything on this page has now been exercised against this address except the
Backend Deploy section, which stays untested.

The SSH host key differs from the one `known_hosts` recorded for the old
address, so this is a new instance rather than a moved Elastic IP. Expect
`REMOTE HOST IDENTIFICATION HAS CHANGED` on a machine that used the old one,
and drop the stale `known_hosts` line rather than working around the warning.

Production is built from `codex/monolith-redesign`, not `main`. `main` is far
behind and does not contain the backend or the Corkboard.

## What Runs Where

| Piece | Location |
| --- | --- |
| Frontend (static) | `/var/www/lindyhop`, served by nginx |
| Backend | `/opt/lindyhop/backend.jar`, systemd unit `lindyhop-backend.service` |
| Backend env | `/etc/lindyhop/backend.env` (contains secrets; do not print or copy) |
| Database | MariaDB on the same host, port `3306` |
| nginx routing | `/etc/nginx/default.d/lindyhop.conf` |
| Backups | `/opt/lindyhop-backup/` (frontend tarballs, nginx configs) |

nginx serves everything as a SPA (`try_files $uri $uri/ /index.html`) and
proxies only `/api/`, `/oauth2/`, and `/login/oauth2/` to `127.0.0.1:8080`.
The backend does not serve the frontend.

The backend env sets `SPRING_PROFILES_ACTIVE=prod`,
`APP_CORS_ALLOWED_ORIGINS=https://lindyhopseoul.com`, `SESSION_COOKIE_SECURE=true`,
and `SERVER_FORWARD_HEADERS_STRATEGY=framework` (needed because it sits behind
nginx).

## Frontend Deploy

Most changes are frontend-only and need no backend work. Confirm with:

```powershell
git diff --name-only <deployed-ref>..HEAD -- backend/
```

If that is empty, do not rebuild the jar, migrate the database, or restart the
backend. Only nginx needs a reload.

### 1. Build with an empty API base URL

This is the step that silently breaks the site.

```powershell
# .env.production.local is gitignored and wins over .env for a production build
"VITE_API_BASE_URL=" | Out-File -Encoding ascii .env.production.local
npm run build
```

Vite bakes `VITE_API_BASE_URL` in at build time. The repository `.env` sets it
to `http://localhost:18080`, and `src/api/*.js` falls back to
`http://localhost:8080` when it is missing, so a plain `npm run build` produces
a bundle that asks the **visitor's own machine** for the API — with no build
error. Production expects the value to be empty so calls go to `/api/...` and
nginx proxies them.

Always check the artifact before uploading it:

```bash
grep -rE 'localhost:(8080|18080)' dist/assets/*.js   # must find nothing
```

### 2. Back up, upload, swap

```bash
TS=$(date +%Y%m%d-%H%M%S)
ssh ec2-user@52.78.185.32 "sudo tar czf /opt/lindyhop-backup/www-lindyhop-$TS.tar.gz -C /var/www lindyhop"
ssh ec2-user@52.78.185.32 "rm -rf ~/deploy-staging && mkdir -p ~/deploy-staging"
scp -r dist/index.html dist/404.html dist/CNAME dist/assets \
       dist/icons dist/manifest.webmanifest dist/sw.js \
       ec2-user@52.78.185.32:~/deploy-staging/
ssh ec2-user@52.78.185.32 '
  sudo cp -a ~/deploy-staging/assets/. /var/www/lindyhop/assets/
  sudo mkdir -p /var/www/lindyhop/icons
  sudo cp -a ~/deploy-staging/icons/. /var/www/lindyhop/icons/
  sudo cp -a ~/deploy-staging/manifest.webmanifest ~/deploy-staging/sw.js /var/www/lindyhop/
  sudo cp -a ~/deploy-staging/index.html ~/deploy-staging/404.html ~/deploy-staging/CNAME /var/www/lindyhop/
  sudo chown -R nginx:nginx /var/www/lindyhop
  sudo chmod -R a+rX /var/www/lindyhop
  sudo nginx -t && sudo systemctl reload nginx
  rm -rf ~/deploy-staging'
```

Copy the new assets in **before** replacing `index.html`, so a request landing
mid-deploy always finds the file its `index.html` points at.

Everything after `dist/assets` on the `scp` line belongs to the installable
app (`pwa.md`). Leaving it out does not fail the deploy — the site keeps
working and the old worker keeps running, so a stale `sw.js` is easy to miss.

`dist/` already contains `CNAME` and `404.html` from `public/`; both must stay
in place.

### 3. Verify

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://lindyhopseoul.com/
curl -s -o /dev/null -w "%{http_code}\n" https://lindyhopseoul.com/api/agora/corkboards/current
curl -s https://lindyhopseoul.com/ | grep -oE 'assets/index-[A-Za-z0-9_-]+\.(js|css)'

# The installable app: sw.js must stay no-cache or new workers never land.
curl -sI https://lindyhopseoul.com/sw.js | grep -i cache-control
curl -sI https://lindyhopseoul.com/manifest.webmanifest | grep -iE 'content-type|cache-control'
```

Then load the site and confirm the bundle filename matches the one you just
built, because a stale `index.html` in your own browser cache will happily show
you the old build and make a good deploy look broken.

## Backend Deploy

**Not yet exercised.** Nothing in this repository has needed it, and the
procedure below has not been run, so treat it as a starting point rather than a
checklist.

The unit runs `/usr/bin/java -Xms128m -Xmx384m -jar /opt/lindyhop/backend.jar`
as user `lindyhop`, reading `/etc/lindyhop/backend.env`. A deploy would mean
building the jar (`mvn -f backend/pom.xml package`), backing up the current one,
copying the new jar in, and `sudo systemctl restart lindyhop-backend.service`.

Run `mvn test` first. Note the prod profile uses `ddl-auto: update`, so starting
a new jar can alter the production schema on its own — see Known Gaps.

## Caching

`/etc/nginx/default.d/lindyhop.conf` sets:

```nginx
location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "no-cache";
}

location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
}

location = /manifest.webmanifest {
    default_type application/manifest+json;
    add_header Cache-Control "no-cache";
}
```

The `manifest.webmanifest` block was added 2026-07-20. nginx ships no
`mime.types` entry for the extension, so the manifest went out as
`application/octet-stream`; browsers parsed it anyway, but the type was wrong.
Its `Cache-Control` is repeated rather than inherited — see the `add_header`
note at the end of this section.

`sw.js`, `manifest.webmanifest` and `icons/` all sit at the site root, so they
fall through to `location /` and get `no-cache`. That is what the service
worker needs: a worker cached long would never be replaced. Do not move any of
them under `/assets/`, which would hand them the immutable header.

`index.html` is the pointer to the current content-hashed bundle, so it must
never be stale. `no-cache` still caches it and only forces a revalidation, which
the ETag answers with a 0-byte `304`. Every SPA route resolves to `index.html`
through `try_files`, so the header belongs on `location /`.

Asset filenames are derived from their content, so a given URL can never change
meaning and is safe to cache forever without revalidating.

`try_files $uri =404` is not cosmetic. Without it a missing bundle falls through
to `index.html` and arrives as `200 text/html` where the browser expects
JavaScript, which fails as a blank page rather than an error.

Before this was configured (fixed 2026-07-16) neither had `Cache-Control` at
all, which was backwards: browsers cached the pointer heuristically and
re-checked the immutable assets.

Note that `add_header` in nginx does not merge: if any deeper block gains its
own `add_header`, it drops every inherited one. Check `nginx -T | grep add_header`
before adding more.

### Old assets

`/var/www/lindyhop/assets/` intentionally holds bundles from earlier deploys.
The cache headers only help caches populated after they were introduced, so a
visitor still holding a pre-fix `index.html` would break if their bundle were
removed. Once those caches have aged out, prune to the last generation or two.

## Rollback

Frontend:

```bash
ssh ec2-user@52.78.185.32 '
  sudo rm -rf /var/www/lindyhop
  sudo tar xzf /opt/lindyhop-backup/www-lindyhop-<TIMESTAMP>.tar.gz -C /var/www
  sudo chown -R nginx:nginx /var/www/lindyhop'
```

nginx config:

```bash
ssh ec2-user@52.78.185.32 '
  sudo cp /opt/lindyhop-backup/nginx/lindyhop.conf.<TIMESTAMP> /etc/nginx/default.d/lindyhop.conf
  sudo nginx -t && sudo systemctl reload nginx'
```

A frontend rollback is safe on its own as long as the backend was untouched.

## Known Gaps

These are real and unaddressed. `README.md` lists several under Future Work.

- **The nginx config lives only on the host.** The block above is a copy, not
  the source; it is invisible to anyone reading the repository and is lost if
  the instance is rebuilt.
- **No CI/CD, no deploy script.** Every deploy is hand-run, so every deploy can
  skip the `VITE_API_BASE_URL` step.
- **Nothing fails the build when `VITE_API_BASE_URL` is missing.** The fallback
  in `src/api/*.js` quietly produces a broken bundle. A guard would remove the
  largest hazard on this page.
- **Secrets sit in plaintext** in `/etc/lindyhop/backend.env`.
- **`ddl-auto: update` on the prod profile.** The application can change the
  production schema at startup. `README.md` proposes Flyway.
- **`main` is far behind production.** Anyone treating `main` as the deployed
  code will be wrong.
