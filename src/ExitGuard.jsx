import React, { useEffect, useRef, useState } from "react";

// Marks the history entries this guard owns, so a back press that lands on one
// is known to be a press at the app's outer edge rather than in-app navigation.
const GUARD_STATE_KEY = "swingpopExitGuard";

/**
 * Stops Android's back gesture from throwing the app away mid-sentence.
 *
 * The app is one page, so at any screen without its own history entry a back
 * press leaves it entirely — and everything typed goes with it. A guard entry
 * sits under the app: back lands on that instead of leaving, and asks first.
 * Answering 취소 puts the guard back, so holding down back never walks out of
 * the app; only 종료 does.
 *
 * In-app navigation is untouched: those entries carry no marker, so going back
 * from /me or out of a modal behaves exactly as before, and the question only
 * appears once there is nothing left to go back to.
 */
export default function ExitGuard() {
  const [isAsking, setIsAsking] = useState(false);
  // Guard entries stacked above the entry the app opened on. Held at one, so
  // leaving is a pop of exactly two.
  const guardDepthRef = useRef(0);
  const isLeavingRef = useRef(false);
  const lastPathRef = useRef(typeof window === "undefined" ? "/" : window.location.pathname);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const pushGuard = () => {
      guardDepthRef.current += 1;
      window.history.pushState({ [GUARD_STATE_KEY]: true }, "");
    };

    // The app navigates with pushState, which fires no event, so without this
    // the last known path would go stale the moment anyone opened a screen —
    // and a back press returning home would be mistaken for one aimed out of
    // the app.
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    const trackPath = (original) =>
      function trackedHistoryMethod(...args) {
        const result = original.apply(this, args);
        lastPathRef.current = window.location.pathname;
        return result;
      };
    window.history.pushState = trackPath(originalPushState);
    window.history.replaceState = trackPath(originalReplaceState);

    const handlePopState = (event) => {
      if (isLeavingRef.current) {
        return;
      }

      const previousPath = lastPathRef.current;
      lastPathRef.current = window.location.pathname;

      const isGuardEntry = event.state?.[GUARD_STATE_KEY] === true;
      const isOpeningEntry = event.state === null;
      if (!isGuardEntry && !isOpeningEntry) {
        // An entry the app pushed for a screen of its own: ordinary back
        // navigation, and there is still somewhere to go back to.
        return;
      }

      // On the opening entry there is nothing underneath, so re-arm at once:
      // no number of further presses can then walk out without an answer.
      if (isOpeningEntry) {
        guardDepthRef.current = 0;
        pushGuard();
      }

      // Coming from another screen, this press meant "go back one" and has
      // already done it — the app is simply home now. Only a press that moved
      // nothing was aimed out of the app.
      if (previousPath === window.location.pathname) {
        setIsAsking(true);
      }
    };

    pushGuard();
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  const leave = () => {
    isLeavingRef.current = true;
    setIsAsking(false);
    // Past every guard entry and past the one the app opened on: where the app
    // was opened from a link or another page, that lands back there.
    window.history.go(-(guardDepthRef.current + 1));

    // A freshly launched installed app has nothing behind its first entry, so
    // that navigation does nothing and this document is still here. Closing the
    // window is the only remaining way out; if the browser refuses, the guard
    // stays disarmed, so the next press leaves the way it did before.
    window.setTimeout(() => {
      if (!document.hidden) {
        window.close();
      }
    }, 200);
  };

  if (!isAsking) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-swing-ink/50 p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setIsAsking(false);
        }
      }}
    >
      <div className="w-full max-w-xs rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-lg">
        <p className="text-base font-bold text-swing-ink">앱을 종료하시겠습니까?</p>
        <p className="mt-1 text-sm text-swing-muted">Close the app?</p>
        <p className="mt-3 text-xs leading-5 text-swing-muted/90">
          작성 중인 내용은 저장되지 않습니다.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsAsking(false)}
            className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-swing-border/55 bg-swing-paper px-4 text-sm font-semibold text-swing-ink/80 transition hover:bg-swing-cream/50"
          >
            취소 / Cancel
          </button>
          <button
            type="button"
            onClick={leave}
            className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-swing-teal-deep px-4 text-sm font-semibold text-swing-paper transition hover:bg-swing-teal"
          >
            종료 / Close
          </button>
        </div>
      </div>
    </div>
  );
}
