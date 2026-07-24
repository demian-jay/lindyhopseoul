// Home-screen install, offered rather than left to the browser menu.
//
// Chrome fires `beforeinstallprompt` once, early, and only if the app qualifies
// — before React has mounted anything that could care. Catching it here, at
// module load, keeps the chance: the event is stashed and handed to whichever
// screen asks for it later. Browsers that never fire it (every iOS one) simply
// leave nothing stashed, and the callers show no install affordance at all.

import { useEffect, useState } from "react";

// Asking is a one-off: answered either way, the offer moves to My Page and stops
// interrupting. Per browser, like the install itself.
const ASKED_STORAGE_KEY = "swingpop-install-asked";

let deferredPrompt = null;
const listeners = new Set();

export function hasBeenAskedToInstall() {
  try {
    return window.localStorage.getItem(ASKED_STORAGE_KEY) === "1";
  } catch {
    // Storage refused (private mode, blocked cookies): treat it as asked rather
    // than asking on every single visit.
    return true;
  }
}

export function rememberInstallAsked() {
  try {
    window.localStorage.setItem(ASKED_STORAGE_KEY, "1");
  } catch {
    // Nothing to do: the ask simply repeats next visit.
  }
}

function notify() {
  listeners.forEach((listener) => listener());
}

// In-app browsers (KakaoTalk, Naver, Instagram, …) run an embedded webview where
// PWA install is impossible — the same webviews where Google also blocks OAuth.
// Single source of truth: App.jsx's login flow imports this rather than keeping
// its own copy. Naver Whale (`Whale/`) is a real browser and must not match.
export const IN_APP_BROWSER_PATTERN =
  /KAKAOTALK|NAVER\(inapp|DaumApps|Instagram|FBAN|FBAV|FB_IAB|Line\/|BAND\/|everytimeApp|KAKAOSTORY/i;

/** True in an embedded in-app browser, where the app cannot be installed. */
export function isInAppBrowser() {
  if (typeof navigator === "undefined") {
    return false;
  }
  return IN_APP_BROWSER_PATTERN.test(navigator.userAgent || "");
}

/** True once the app is running from the home screen rather than a browser tab. */
export function isInstalled() {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    // iOS predates display-mode and reports it here instead.
    window.navigator.standalone === true
  );
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    // Holding the event back is what makes it ours to fire later; without this
    // the browser shows its own bar and the event is spent.
    event.preventDefault();
    deferredPrompt = event;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

/**
 * Shows the browser's install dialog. Resolves to true when the user accepted.
 *
 * The stashed event is single-use — a dismissed prompt cannot be re-fired — so
 * it is dropped either way, and the caller's affordance disappears with it.
 * Chrome fires `beforeinstallprompt` again on a later visit if the app is still
 * uninstalled, which is what brings the affordance back.
 */
export async function promptInstall() {
  if (!deferredPrompt) {
    return false;
  }

  const event = deferredPrompt;
  deferredPrompt = null;
  notify();

  try {
    await event.prompt();
    const choice = await event.userChoice;
    return choice?.outcome === "accepted";
  } catch {
    // A prompt the browser refuses to show (already dismissed too often, no
    // longer eligible) is not an error worth surfacing: there is simply no
    // install to offer.
    return false;
  }
}

/**
 * iOS, where installing exists but is never offered to the page: Safari has no
 * `beforeinstallprompt` at all, so the only route is the share sheet and the
 * only thing the app can do is say so.
 */
function isIOS() {
  if (typeof navigator === "undefined") {
    return false;
  }
  const ua = navigator.userAgent || "";
  // An iPad on iPadOS 13+ reports itself as a Mac; the touch points give it away.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function readState() {
  const installed = isInstalled();
  const inAppBrowser = isInAppBrowser();
  const canInstall = deferredPrompt !== null && !installed;
  return {
    installed,
    canInstall,
    // In an in-app browser there is nothing to install and no iOS share sheet
    // that would help — the screens show "open in a real browser" instead.
    inAppBrowser: inAppBrowser && !installed,
    // Nothing to click, so the screens show the share-sheet steps instead.
    showIosGuide: !installed && !canInstall && !inAppBrowser && isIOS(),
  };
}

/**
 * Install state for the screens that offer it: whether one can be started now,
 * and whether the app is already on the home screen. Both are surfaced because
 * an installed app has nothing to offer but should still say so — a card that
 * vanishes on success reads as a feature that disappeared.
 */
export function useInstallState() {
  const [state, setState] = useState(readState);
  // The display-mode check only ever sees the installed app *from inside it*. To
  // say "설치됨" in an ordinary browser tab too, ask the browser whether this
  // very app is installed — Chrome on Android answers via getInstalledRelatedApps
  // (the manifest lists itself under related_applications). Everywhere else the
  // call is absent or resolves empty, and this stays false.
  const [relatedInstalled, setRelatedInstalled] = useState(false);

  useEffect(() => {
    const update = () => setState(readState());
    listeners.add(update);

    // Launching from the home screen is a display-mode change rather than an
    // event of ours, and on desktop the window can move between the two.
    const standalone = window.matchMedia?.("(display-mode: standalone)");
    standalone?.addEventListener?.("change", update);

    update();

    let active = true;
    // Optional-chaining the call yields undefined where the API is absent, and
    // Promise.resolve makes that safe to await instead of throwing on `.then`.
    Promise.resolve(navigator.getInstalledRelatedApps?.())
      .then((apps) => {
        if (active && Array.isArray(apps) && apps.length > 0) {
          setRelatedInstalled(true);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
      listeners.delete(update);
      standalone?.removeEventListener?.("change", update);
    };
  }, []);

  // An install found through related-apps counts the same as running standalone:
  // it is installed, so nothing to offer and nothing to guide toward.
  const installed = state.installed || relatedInstalled;
  return {
    installed,
    canInstall: state.canInstall && !installed,
    inAppBrowser: state.inAppBrowser && !installed,
    showIosGuide: state.showIosGuide && !installed,
  };
}
