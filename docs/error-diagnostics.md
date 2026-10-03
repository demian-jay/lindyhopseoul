# Error diagnostics

Added 2026-10-04 after a reported browser failure following member signup.
The original browser exception was not retained; this instrumentation does not
establish or repair its unknown root cause.

Deployed with explicit user approval on 2026-10-04 around 03:28 Asia/Seoul.
Backup: `/opt/lindyhop-backup/diagnostics-20261003-182802` (UTC filename),
containing the previous backend JAR, frontend tarball and nginx config.
Backend was stopped before replacing its JAR and started successfully with
`NRestarts=0`. The log directory is `/opt/lindyhop/logs`, configured by
`/etc/systemd/system/lindyhop-backend.service.d/diagnostics.conf`.
The nginx limits/source-map protection from `docs/nginx/client-diagnostics.conf`
are installed at the top of `/etc/nginx/default.d/lindyhop.conf`.

Post-deploy: both member hosts and admin root/API routes returned 200; OAuth
callback hosts and www redirects passed; collector returned 202 for a valid
synthetic event, 400 for malformed JSON and 413 for an oversized body. The
synthetic event was found in `diagnostics.log`. Source-map URLs return 404.
Real-browser member/admin screens and the 390px signup entry were checked.
No real new-account Google signup or authenticated admin operations were tested.
Pre-deploy backend tests: 192 passed; frontend diagnostics tests: 3 passed.
Local backend runtime was unavailable because the Docker DB was not running.

The deployed browser entry is `assets/index-CAug3Aix.js`, with app chunk
`assets/main-BK0Pcbjt.js`. Matching JS/maps are retained privately under
`.diagnostics-builds/index-CAug3Aix/` in this checkout, excluded from Git and
public uploads. Preserve that directory when cleaning generated build output.

## Captured signals

- JavaScript errors, unhandled promise rejections, resource load errors,
  startup/import failures, React render failures, console warnings/errors, and
  service-worker uncaught errors/rejections (at most 10 per worker lifetime).
- API non-2xx responses, network failures, and invalid JSON responses, including
  failures callers catch without displaying them.
- Server request status/duration with generated `X-Request-ID`; unexpected
  exception classes and application stack locations; OAuth success/failure and
  whether a new member was created.
- React/startup failures show a bilingual recovery screen and client event ID.

Client reports go to `POST /api/diagnostics/client-errors`, without cookies or
authorization headers, and appear as `CLIENT_ERROR`. Match `apiRequestId` to
`REQUEST_FAILED` / `SERVER_ERROR`, or search the recovery screen's `eventId`.
Reports are untrusted diagnostic input, not proof of a server-side event.

Messages, console arguments, query strings, forms, response bodies, storage,
cookies, credentials, member names/email/provider IDs, and full user-agent
strings are not collected. Only known route segments are kept; dynamic and
unknown segments become `:id`. Stack traces retain file/line/column or application
class/method/line, not exception messages. Server validates and bounds fields.

## Storage and limits

Logback writes diagnostics to `${DIAGNOSTICS_LOG_DIR}/diagnostics.log`; the
default is `target/diagnostics` relative to the backend working directory.
Production should set `DIAGNOSTICS_LOG_DIR=/opt/lindyhop/logs`, with the directory
owned by `lindyhop` and inaccessible to public web requests.
Files rotate at 5 MB, with 14 days and 64 MB total archived retention limits.
Diagnostic events also remain in the systemd journal.

Clients deduplicate identical reports and send at most 30 per page load;
the server allows 300 report requests per minute per instance, before parsing.
Content-Length above 16 KiB is rejected; nginx must also bound this endpoint
to 16 KiB for chunked bodies. Payload validation rejects oversized fields and
log injection. These bounds protect availability but can drop events during
storms. Network-blocked/offline reports cannot reach the server. Logical bugs,
swallowed non-API exceptions and errors before the bootstrap script loads
are not guaranteed to be captured.

Hidden source maps are generated under `dist/assets`. Keep them with the
matching build privately, and exclude `.map` files from frontend uploads.
Build stamps show `-modified` when app source has uncommitted changes.

## Read-only investigation

```bash
ssh lindyhop 'sudo grep "CLIENT_ERROR" /opt/lindyhop/logs/diagnostics.log | tail -50'
ssh lindyhop 'sudo journalctl -u lindyhop-backend --since "2026-10-04 00:00:00 Asia/Seoul" --no-pager'
```

Search event/request IDs rather than member information. Correlate creation,
callback and browser events before claiming an incident's root cause.
