# Production Deployment

This file is the note to check before deploying to `swingpopseoul.com`.

Last updated: 2026-07-21

Deployment is manual. There is no CI/CD, `Dockerfile`, or deploy script in this
repository; every step below is run by hand.

## Current Production

- Site: `https://swingpopseoul.com` is the one in use; `https://lindyhopseoul.com`
  still resolves and serves the same thing. Both answer on `www.` too, and all
  four names come off the same host, so a deploy covers them together.
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

Every procedure on this page has since been run against this address, the
backend deploy included.

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

The backend env sets `SPRING_PROFILES_ACTIVE=prod`, `SESSION_COOKIE_SECURE=true`,
and `SERVER_FORWARD_HEADERS_STRATEGY=framework` (needed because it sits behind
nginx).

`APP_CORS_ALLOWED_ORIGINS` is set to `https://lindyhopseoul.com` only, which
looks wrong for `swingpopseoul.com` but is not: the page and the API share an
origin here, because the build ships an empty `VITE_API_BASE_URL` and nginx
proxies `/api/` on the same host, so the browser never makes a cross-origin
request and the value is never consulted. It matters for local dev, where Vite
on 5173 does call another port. Confirmed 2026-07-20 — no
`Access-Control-Allow-Origin` comes back for either domain.

`APP_OAUTH2_ALLOWED_REDIRECT_HOSTS` is the one that does list both domains, and
that is what returns a Google sign-in to whichever host it started from. The
`APP_OAUTH2_*_REDIRECT_URI` pair is only the fallback.

`ADMIN_INITIAL_PASSWORD` is optional and read only when seeding the `admin`
account into an empty database. Unset, the seeder generates a random password
and logs it once. Production is long past that point, so it is absent there.

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
curl -s -o /dev/null -w "%{http_code}\n" https://swingpopseoul.com/
curl -s -o /dev/null -w "%{http_code}\n" https://swingpopseoul.com/api/agora/corkboards/current
curl -s https://swingpopseoul.com/ | grep -oE 'assets/index-[A-Za-z0-9_-]+\.(js|css)'

# The installable app: sw.js must stay no-cache or new workers never land.
curl -sI https://swingpopseoul.com/sw.js | grep -i cache-control
curl -sI https://swingpopseoul.com/manifest.webmanifest | grep -iE 'content-type|cache-control'

# The build stamp baked into the bundle, and the commit it should name: the
# last one that touched app code, which is not necessarily HEAD.
BUNDLE=$(curl -s https://swingpopseoul.com/ | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js')
curl -s "https://swingpopseoul.com/$BUNDLE" |
  grep -oE '"20[0-9]{2}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2} · [0-9a-f]{7,}"' | head -1
git log -1 --format=%h -- src/ public/ index.html vite.config.js
```

Then load the site and confirm the bundle filename matches the one you just
built, because a stale `index.html` in your own browser cache will happily show
you the old build and make a good deploy look broken.

The admin sidebar prints that same stamp under the menu, so anyone reporting a
problem can be asked for it rather than guessing which build they are on. It
records the commit as of the **build**, so commit first, then build, then
deploy — building before committing stamps the previous commit and the display
quietly lies.

Compare it against the last commit that touched app code, not `HEAD`. A commit
that only edits docs ships nothing, so the stamp keeps naming the commit before
it. That is correct, not a missed deploy.

## Backend Deploy

Exercised; `/opt/lindyhop-backup/backend-*.jar` is the record of past runs.

The unit runs `/usr/bin/java -Xms128m -Xmx384m -jar /opt/lindyhop/backend.jar`
as user `lindyhop`, reading `/etc/lindyhop/backend.env`.

```bash
mvn -f backend/pom.xml package     # runs the tests; do not skip them
TS=$(date +%Y%m%d-%H%M%S)
ssh ec2-user@52.78.185.32 "sudo cp -a /opt/lindyhop/backend.jar /opt/lindyhop-backup/backend-$TS.jar"
ssh ec2-user@52.78.185.32 "rm -rf ~/jar-staging && mkdir -p ~/jar-staging"
scp backend/target/backend-0.1.0-SNAPSHOT.jar ec2-user@52.78.185.32:~/jar-staging/backend.jar
ssh ec2-user@52.78.185.32 '
  sudo cp ~/jar-staging/backend.jar /opt/lindyhop/backend.jar
  sudo chown lindyhop:lindyhop /opt/lindyhop/backend.jar
  sudo chmod 644 /opt/lindyhop/backend.jar
  sudo systemctl restart lindyhop-backend.service
  rm -rf ~/jar-staging'
```

The host runs Corretto 21 and `pom.xml` sets `<java.version>21</java.version>`,
so a jar built on a newer JDK still targets 21. Worth confirming when the
toolchain changes:

```bash
unzip -p backend/target/backend-0.1.0-SNAPSHOT.jar \
  BOOT-INF/classes/com/lindyhopseoul/backend/BackendApplication.class |
  od -An -t u1 -N8   # 7th and 8th bytes are the major version; 65 is Java 21
```

Startup takes about 15 seconds, and `/api/` answers 502 until it finishes.
Check it came up rather than assuming:

```bash
ssh ec2-user@52.78.185.32 'systemctl is-active lindyhop-backend.service
  sudo systemctl show lindyhop-backend.service -p NRestarts
  sudo journalctl -u lindyhop-backend.service --since "3 minutes ago" --no-pager | tail -20'
```

`NRestarts` above 0 means it is crash-looping on `Restart=on-failure`. A
`NoClassDefFoundError` from `SpringApplicationShutdownHook` in the log is the
*old* process dying after its jar was replaced underneath it, not the new one
failing; check the PID before chasing it.

Sessions survive a restart. Both kinds live in the database — members in
`SPRING_SESSION`, admins in `admin_session` — so a deploy no longer signs
everyone out. That was true until 2026-07-27, when both were an in-memory map.

The prod profile uses `ddl-auto: update`, so the new jar can alter the schema
as it starts — see Known Gaps. `admin_session` is created that way;
`SPRING_SESSION` is not a JPA entity and is created instead by Spring Session's
own initializer (`spring.session.jdbc.initialize-schema: always`). Neither
needs a manual migration step.

The deploy that first carries this signs everyone out once, because the member
cookie changes name from `JSESSIONID` to `SESSION` and no admin token predates
the table. After that, restarts are invisible to signed-in users.

### Order matters when both sides change

Deploy whichever side tolerates the other being old, and deploy the second one
immediately. A backend that starts refusing requests the current frontend
cannot handle leaves the admin area unusable in a way nobody can click out of.

That was live for a few minutes on 2026-07-20: the backend began answering
`403 PASSWORD_CHANGE_REQUIRED` on every admin route while the deployed frontend
still had no screen for setting a password. Sign-in worked and nothing else
did. If a change has that shape, deploy the frontend first — it can carry a
screen the backend does not demand yet, but not the reverse.

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
- **Nothing sequences a paired frontend and backend deploy.** The two are
  separate hand-run procedures, so the window where one is new and the other is
  old is however long the operator takes. See "Order matters" above for the
  time that bit.
