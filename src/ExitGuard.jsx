import React, { useEffect, useRef, useState } from "react";

// Marks the history entries this guard owns, so a back press that lands on one
// is known to be a press at the app's outer edge rather than in-app navigation.
const GUARD_STATE_KEY = "swingpopExitGuard";
// Marks the entry the app opened on — the one below the guard. Landing there is
// the only press with nothing left to go back to. It needs its own marker
// because an unmarked entry is not distinctive: a fragment link (#schedule) also
// pushes an entry whose state is null, and Chrome fires popstate for it.
const OPENING_STATE_KEY = "swingpopExitGuardOpening";

// One language at a time: whoever is reading has already told the app which one
// they read, on the public site by picking it and in the admin app in their
// profile, and both publish it on <html lang>.
const COPY = {
  ko: {
    title: "앱을 종료하시겠습니까?",
    warning: "작성 중인 내용은 저장되지 않습니다.",
    cancel: "취소",
    leave: "종료",
  },
  en: {
    title: "Close the app?",
    warning: "Anything you are part-way through writing will not be saved.",
    cancel: "Cancel",
    leave: "Close",
  },
};

/**
 * Stops Android's back gesture from throwing the app away mid-sentence.
 *
 * The app is one page, so at any screen without its own history entry a back
 * press leaves it entirely — and everything typed goes with it. A guard entry
 * sits under the app: back lands on that instead of leaving, and asks first.
 * Answering 취소 puts the guard back, so holding down back never walks out of
 * the app; only 종료 does.
 *
 * In-app navigation is untouched: the question is asked only on the entry the
 * app opened on, so going back from /me, out of a modal, or over a fragment
 * link behaves exactly as before — those presses land above that entry, having
 * been consumed by the layer they closed.
 */
export default function ExitGuard() {
  const [isAsking, setIsAsking] = useState(false);
  // Guard entries stacked above the entry the app opened on. Held at one, so
  // leaving is a pop of exactly two.
  const guardDepthRef = useRef(0);
  const isLeavingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const pushGuard = () => {
      guardDepthRef.current += 1;
      window.history.pushState({ [GUARD_STATE_KEY]: true }, "");
    };

    // The app replaces state of its own accord (see main.jsx), which would drop
    // the marker and leave the outermost entry unrecognisable, so carry it over.
    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = function markedReplaceState(state, ...rest) {
      const carried = window.history.state?.[OPENING_STATE_KEY] === true
        ? { ...(state || {}), [OPENING_STATE_KEY]: true }
        : state;
      return originalReplaceState.call(this, carried, ...rest);
    };

    const handlePopState = (event) => {
      if (isLeavingRef.current) {
        return;
      }

      // Landing anywhere above the opening entry means the press was consumed by
      // something of the app's own — a modal closing, a screen going back, a
      // fragment link unwinding — and there is still somewhere to go back to.
      // Only the opening entry has nothing underneath it.
      if (event.state?.[OPENING_STATE_KEY] !== true) {
        return;
      }

      // Nothing underneath, so re-arm at once: no number of further presses can
      // then walk out without an answer.
      guardDepthRef.current = 0;
      pushGuard();
      setIsAsking(true);
    };

    window.history.replaceState(
      { ...(window.history.state || {}), [OPENING_STATE_KEY]: true },
      ""
    );
    pushGuard();
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  const leave = () => {
    isLeavingRef.current = true;
    setIsAsking(false);

    // Unwind exactly our own guard entries, landing back on the entry the app
    // opened on with nothing above it. The old code went back one further and
    // overshot the start of history, which is a no-op — so it stayed on a guard
    // entry, where window.close() is refused and the dialog just reappeared.
    if (guardDepthRef.current > 0) {
      window.history.go(-guardDepthRef.current);
    }
    guardDepthRef.current = 0;

    // Now on the opening entry with the guard disarmed. An installed app closes
    // here; a browser that refuses window.close() leaves the user at the app's
    // root with nothing intercepting, so their next back press exits the way the
    // platform does it, instead of re-opening this dialog. The delay lets the
    // history.go above settle first.
    window.setTimeout(() => {
      try {
        window.close();
      } catch {
        // Refused: native back now exits, nothing more to do.
      }
    }, 50);
  };

  if (!isAsking) {
    return null;
  }

  // The guard sits outside both apps, so it reads their chrome off the document
  // rather than holding state neither of them shares with it: the language each
  // app publishes on <html lang>, and the `dark` class the admin shell puts on
  // its own subtree — which this dialog is not inside, hence the copy.
  const copy = document.documentElement.lang.toLowerCase().startsWith("en") ? COPY.en : COPY.ko;
  const isDark = document.querySelector(".dark") !== null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-[90] flex items-center justify-center bg-swing-ink/50 p-5${isDark ? " dark" : ""}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setIsAsking(false);
        }
      }}
    >
      <div className="w-full max-w-xs rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-lg">
        <p className="text-base font-bold text-swing-ink">{copy.title}</p>
        <p className="mt-3 text-xs leading-5 text-swing-muted/90">{copy.warning}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsAsking(false)}
            className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-swing-border/55 bg-swing-paper px-4 text-sm font-semibold text-swing-ink/80 transition hover:bg-swing-cream/50"
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            onClick={leave}
            className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-swing-teal-deep px-4 text-sm font-semibold text-swing-paper transition hover:bg-swing-teal"
          >
            {copy.leave}
          </button>
        </div>
      </div>
    </div>
  );
}
