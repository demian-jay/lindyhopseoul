// The admin app has a host of its own (admin.swingpopseoul.com) so it installs
// as a separate app from the members' one. Same build, same server root: which
// app a visit is depends on the host it arrived on, and on the main domain the
// /admin path keeps working exactly as it did.

/** True when this page is being served as the admin app's own origin. */
export function isAdminHost() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.location.hostname.startsWith("admin.");
}

/**
 * Points the document at the manifest for whichever app this is. A browser reads
 * the manifest when the visitor installs, not at load, so swapping the link here
 * — before anything can be installed — is enough to decide which app is created.
 */
export function applyManifestForHost() {
  if (typeof document === "undefined" || !isAdminHost()) {
    return;
  }
  const link = document.querySelector('link[rel="manifest"]');
  if (link) {
    link.setAttribute("href", "/admin.webmanifest");
  }
}
