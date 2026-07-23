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

function readState() {
  const installed = isInstalled();
  return { installed, canInstall: deferredPrompt !== null && !installed };
}

/**
 * Install state for the screens that offer it: whether one can be started now,
 * and whether the app is already on the home screen. Both are surfaced because
 * an installed app has nothing to offer but should still say so — a card that
 * vanishes on success reads as a feature that disappeared.
 */
export function useInstallState() {
  const [state, setState] = useState(readState);

  useEffect(() => {
    const update = () => setState(readState());
    listeners.add(update);

    // Launching from the home screen is a display-mode change rather than an
    // event of ours, and on desktop the window can move between the two.
    const standalone = window.matchMedia?.("(display-mode: standalone)");
    standalone?.addEventListener?.("change", update);

    update();
    return () => {
      listeners.delete(update);
      standalone?.removeEventListener?.("change", update);
    };
  }, []);

  return state;
}
