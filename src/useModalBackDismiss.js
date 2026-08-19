import { useEffect, useRef } from "react";

/**
 * Gives an open modal a history entry of its own, so the back gesture closes it
 * instead of reaching whatever sits behind it — the page on the public side, the
 * exit prompt in the admin app, neither of which the press was aimed at.
 *
 * Modals stack, and every open one listens, so a press must only reach the one
 * on top: a modal closes when the entry it pushed is no longer the current one.
 * A modal opened over another therefore unwinds one press at a time, leaving the
 * one underneath on screen rather than collapsing the whole stack at once.
 *
 * `key` distinguishes the entries and must be stable for the life of the modal.
 *
 * <h3>Why the entry is owned rather than pushed per effect run</h3>
 *
 * StrictMode runs an effect, tears it down, and runs it again on mount. The
 * teardown here is a `history.back()`, which is asynchronous, so it used to land
 * *after* the second run had already pushed a replacement — popping the app past
 * the modal's entry the instant it opened, which the listener then read as a
 * back press and closed the modal on. Every modal in the admin app opened and
 * vanished in the same frame.
 *
 * Two things fix it, and both are worth keeping even where effects run once:
 * the entry is pushed once per *open* rather than once per effect run, tracked
 * on a ref that outlives the teardown; and the unwind is deferred a tick so a
 * re-run can cancel it. An effect whose teardown is async cannot be correct
 * otherwise.
 */
export default function useModalBackDismiss(isOpen, key, onDismiss) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  // Whether this modal currently has an entry of its own on the stack. On a ref
  // because it has to survive a teardown that is about to be followed by another
  // run of the same effect.
  const ownsEntryRef = useRef(false);
  const unwindTimerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || !isOpen) {
      return undefined;
    }

    // A teardown is only ever still pending here when it is about to be undone
    // by this very run, so cancel it and keep the entry already owned.
    if (unwindTimerRef.current !== null) {
      window.clearTimeout(unwindTimerRef.current);
      unwindTimerRef.current = null;
    }

    if (!ownsEntryRef.current) {
      window.history.pushState({ swingModal: key }, "");
      ownsEntryRef.current = true;
    }

    const handleModalPop = () => {
      // Landing back on our own entry means a modal above this one was closed;
      // this modal is now the top one and stays open.
      if (window.history.state?.swingModal === key) {
        return;
      }
      // The press took our entry with it, so there is nothing left to unwind.
      ownsEntryRef.current = false;
      onDismissRef.current();
    };

    window.addEventListener("popstate", handleModalPop);

    return () => {
      window.removeEventListener("popstate", handleModalPop);

      if (!ownsEntryRef.current) {
        return;
      }

      // Closed from the UI instead of by going back: drop the entry we added, or
      // the user's next back press would be spent undoing this modal. Deferred
      // so that a teardown which is really only a prelude to another run of this
      // effect can call it off above.
      unwindTimerRef.current = window.setTimeout(() => {
        unwindTimerRef.current = null;
        if (!ownsEntryRef.current) {
          return;
        }
        ownsEntryRef.current = false;
        if (window.history.state?.swingModal === key) {
          window.history.back();
        }
      }, 0);
    };
  }, [isOpen, key]);
}
