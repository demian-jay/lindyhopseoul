// Service worker for the installable (standalone) app.
//
// Its only job right now is to make the site installable and to keep it usable
// when the network drops. It deliberately does NOT try to be a full offline
// app: deploys here are manual (see docs/deployment.md), so an aggressive cache
// would strand people on an old build with no way to tell.
//
// Bump CACHE when the caching rules below change. Everything not matching the
// current name is dropped on activate.
const CACHE = "swingpop-v2";

// The SPA shell. nginx answers every route with index.html, so one entry is
// enough to render any client-side route while offline.
const SHELL = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(SHELL))
      // A failed precache must not block activation; the fetch handler falls
      // back to the network anyway.
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)))
      )
      .then(() => self.clients.claim())
  );
});

// Paths the worker must never intercept. The API carries per-member state and
// the OAuth paths are backend redirects; serving either from cache, or even
// re-issuing the request, would break login in ways that are hard to see.
const BYPASS = ["/api/", "/oauth2/", "/login/oauth2/"];

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (BYPASS.some((prefix) => url.pathname.startsWith(prefix))) return;

  // Navigations go to the network first so a deploy is picked up immediately.
  // The cached shell is a fallback for genuine offline, not a fast path. On
  // every successful load, refresh it, so the fallback is the last version the
  // user actually saw rather than whatever was current when the worker first
  // installed. Without this a single offline moment could pin a phone to a
  // months-old build — which is exactly how a stale admin UI ended up fighting
  // a newer backend.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(SHELL, copy));
          }
          return response;
        })
        .catch(() => caches.match(SHELL).then((hit) => hit || Response.error()))
    );
    return;
  }

  // Build output under /assets/ is content-hashed, so a given URL can never
  // change meaning and is safe to serve from cache without revalidating.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
  }
});
