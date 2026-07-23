import React, { useEffect, useRef, useState } from "react";

// Marks the history entries this guard owns, so a back press that lands on one
// is known to be a press at the app's outer edge rather than in-app navigation.
const GUARD_STATE_KEY = "swingpopExitGuard";
// Marks the entry the app opened on — the one below the guard. Landing there is
// the only press with nothing left to go back to. It needs its own marker
// because an unmarked entry is not distinctive: a fragment link (#schedule) also
// pushes an entry whose state is null, and Chrome fires popstate for it.
const OPENING_STATE_KEY = "swingpopExitGuardOpening";

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
