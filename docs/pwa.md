# Installable App (PWA)

Last updated: 2026-07-20

Stage 1 only: the site can be installed to a home screen and launches without
browser chrome. Push notifications are deliberately not built — see Stage 2.

## What Makes It Installable

| Piece | File |
| --- | --- |
| Manifest | `public/manifest.webmanifest` |
| Icons | `public/icons/` (192, 512, 512 maskable, apple-touch, favicon) |
| Service worker | `public/sw.js` |
| Registration | `src/main.jsx`, production builds only |
| Meta tags | `index.html` |

Everything in `public/` is copied to the root of `dist/`, so the manifest and
worker are served from `/manifest.webmanifest` and `/sw.js`.

The worker registers only when `import.meta.env.PROD` is set. On the dev server
it would sit in front of HMR and serve confusing results. To exercise it
locally use `npm run preview`, which serves the real build; `localhost` counts
as a secure context, so registration works there without HTTPS.

`start_url` is `/admin`, so the home-screen icon opens the admin screen for
committee members. `scope` is `/`, which is wider on purpose: moving from the
admin screen to `/` or `/corkboard` stays inside the installed app instead of
kicking the user out to a browser tab.

Icons are generated shapes in the brand palette, not artwork. Replacing them is
just a matter of dropping new PNGs at the same paths.

## What the Worker Caches

It is not a full offline app. Deploys here are manual, so an aggressive cache
would strand people on an old build with no way to tell.

| Request | Behaviour |
| --- | --- |
| `/api/`, `/oauth2/`, `/login/oauth2/` | Never intercepted |
| Navigations | Network first, cached shell only if the network fails |
| `/assets/` | Cache first — content-hashed, so a URL cannot change meaning |
| Anything else | Passed through |

Network-first navigation is what keeps a deploy visible immediately. The cached
shell exists so a launch without signal still renders something.

## Changing the Worker

Bump `CACHE` in `public/sw.js` whenever the caching rules change. `activate`
deletes every cache whose name does not match, so a stale ruleset cannot
survive. Leaving the name alone while changing the rules is the one way to get
a mixed cache.

`sw.js` sits at the site root, so nginx serves it from `location /` with
`Cache-Control: no-cache` (see `deployment.md`). That is what lets a new worker
be noticed. If it ever moves under `/assets/` it would inherit the immutable
header and updates would stop landing.

## Stage 2, Not Built

Push notifications need a good deal more than this page covers: a VAPID key
pair, subscription storage per member, a backend send path, and a permission
prompt placed so it does not get denied on first sight. None of that exists
yet. Decide whether it is wanted after the install flow has been used for a
while.
