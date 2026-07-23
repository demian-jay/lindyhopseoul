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
 */
export default function useModalBackDismiss(isOpen, key, onDismiss) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (typeof window === "undefined" || !isOpen) {
      return undefined;
    }

    window.history.pushState({ swingModal: key }, "");

    const handleModalPop = () => {
      // Landing back on our own entry means a modal above this one was closed;
      // this modal is now the top one and stays open.
      if (window.history.state?.swingModal === key) {
        return;
      }
      onDismissRef.current();
    };

    window.addEventListener("popstate", handleModalPop);

    return () => {
      window.removeEventListener("popstate", handleModalPop);

      // Closed from the UI instead of by going back: drop the entry we added,
      // or the user's next back press would be spent undoing this modal.
      if (window.history.state?.swingModal === key) {
        window.history.back();
      }
    };
  }, [isOpen, key]);
}
