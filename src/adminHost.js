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
 * Points the document at the manifest, icon and title for whichever app this is.
 * A browser reads all of these when the visitor installs, not at load, so
 * swapping them here — before anything can be installed — is enough to decide
 * which app is created. The document ships with the members app's, since that is
 * every host but one.
 */
export function applyManifestForHost() {
  if (typeof document === "undefined" || !isAdminHost()) {
    return;
  }

  const manifest = document.querySelector('link[rel="manifest"]');
  if (manifest) {
    manifest.setAttribute("href", "/admin.webmanifest");
  }

  // iOS takes the home-screen icon and name from these rather than the manifest
  // before 16.4, and still honours them after.
  const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
  if (appleIcon) {
    appleIcon.setAttribute("href", "/icons/admin-apple-touch-icon.png");
  }
  const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitle) {
    appleTitle.setAttribute("content", "스윙팝 운영");
  }
}
