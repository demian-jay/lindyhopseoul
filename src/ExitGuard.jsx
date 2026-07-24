import React, { useEffect, useRef, useState } from "react";

// Marks the guard entry this component keeps above the app's opening entry, so a
// back press that lands on that opening entry is known to be one aimed out of
// the app rather than in-app navigation.
const GUARD_STATE_KEY = "swingpopExitGuard";
// Marks the entry the app opened on. Landing there is the only press with
// nothing left to go back to. It needs its own marker because an unmarked entry
// is not distinctive — a fragment link (#schedule) also pushes an entry whose
// state is null, and Chrome fires popstate for it.
const OPENING_STATE_KEY = "swingpopExitGuardOpening";

// How long "press back again to exit" stays armed. Within it a second back
// leaves the app; after it the guard is put back so a later press asks again.
const EXIT_WINDOW_MS = 2000;

// One language at a time, read off <html lang> — whoever is here has already
// told the app which one they read (public site by picking it, admin app in
// their profile), and both publish it there.
const COPY = {
  ko: "한 번 더 뒤로가기를 누르면 종료됩니다.",
  en: "Press back again to exit.",
};

/**
 * Keeps Android's back gesture from throwing the app away in one press — and
 * the writing in it with it — while still letting a deliberate exit through.
 *
 * The app is one page, so a back press at any screen without its own history
 * entry leaves the whole thing. A guard entry sits under the app: the first
 * back lands on the opening entry instead of leaving, and shows "press back
 * again to exit". A second back within a couple of seconds is at the very
 * bottom of history, so the platform closes the app itself — the only way a web
 * page can end an installed PWA, since it may not close its own window. If the
 * second press does not come, the guard is restored and the next press asks
 * again.
 *
 * In-app navigation is untouched: the prompt is armed only on the opening entry,
 * so going back from a screen, out of a modal, or over a fragment link behaves
 * exactly as before.
 */
export default function ExitGuard() {
  const [showHint, setShowHint] = useState(false);
  const rearmTimerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const pushGuard = () => window.history.pushState({ [GUARD_STATE_KEY]: true }, "");

    // The app replaces state of its own accord (see main.jsx), which would drop
    // the opening marker and leave the outermost entry unrecognisable, so carry
    // it over.
    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = function markedReplaceState(state, ...rest) {
      const carried =
        window.history.state?.[OPENING_STATE_KEY] === true
          ? { ...(state || {}), [OPENING_STATE_KEY]: true }
          : state;
      return originalReplaceState.call(this, carried, ...rest);
    };

    const clearRearm = () => {
      if (rearmTimerRef.current) {
        window.clearTimeout(rearmTimerRef.current);
        rearmTimerRef.current = null;
      }
    };

    const handlePopState = (event) => {
      // Anything above the opening entry is in-app navigation and behaves
      // normally; only the opening entry means one more back leaves the app.
      if (event.state?.[OPENING_STATE_KEY] !== true) {
        return;
      }

      // Now on the opening entry with nothing above it: the next hardware back
      // exits the app the platform's own way. Arm that and say so — crucially
      // WITHOUT pushing a new guard, since an entry above here is exactly what
      // would stop that back from exiting.
      setShowHint(true);
      clearRearm();
      rearmTimerRef.current = window.setTimeout(() => {
        rearmTimerRef.current = null;
        setShowHint(false);
        // The window passed with no second press: put the guard back so a later
        // back asks again instead of leaving straight away.
        pushGuard();
      }, EXIT_WINDOW_MS);
    };

    window.history.replaceState({ ...(window.history.state || {}), [OPENING_STATE_KEY]: true }, "");
    pushGuard();
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.history.replaceState = originalReplaceState;
      clearRearm();
    };
  }, []);

  if (!showHint) {
    return null;
  }

  // Read off the document rather than any app state this sits outside of. The
  // toast is dark on light text either way, so it needs no theme handling — it
  // renders outside the admin shell's `.dark` subtree.
  const hint = document.documentElement.lang.toLowerCase().startsWith("en") ? COPY.en : COPY.ko;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[95] flex justify-center px-5">
      <div className="rounded-full bg-swing-ink/90 px-4 py-2 text-sm font-semibold text-swing-paper shadow-lg">
        {hint}
      </div>
    </div>
  );
}
