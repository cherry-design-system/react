"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type ForwardedRef,
  type MouseEvent,
  type PointerEvent,
  type SyntheticEvent,
} from "react";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Assigns one node to an internal ref and a forwarded ref. */
export function useMergedRef<T>(
  internal: { current: T | null },
  forwarded: ForwardedRef<T>,
) {
  return useCallback(
    (node: T | null) => {
      internal.current = node;
      if (typeof forwarded === "function") forwarded(node);
      else if (forwarded) forwarded.current = node;
    },
    [internal, forwarded],
  );
}

function outside(dialog: HTMLElement, x: number, y: number) {
  const r = dialog.getBoundingClientRect();
  return x < r.left || x > r.right || y < r.top || y > r.bottom;
}

export interface DialogHandlers {
  onCancel: (event: SyntheticEvent<HTMLDialogElement>) => void;
  onClose: (event: SyntheticEvent<HTMLDialogElement>) => void;
  onPointerDown: (event: PointerEvent<HTMLDialogElement>) => void;
  onClick: (event: MouseEvent<HTMLDialogElement>) => void;
}

/**
 * Drives a native <dialog> from a controlled `open` prop: showModal() on
 * open, close() on close (CSS plays the exit through allow-discrete), Escape
 * and backdrop clicks ask `onClose`, and focus returns to whatever had it
 * before the dialog opened. The caller's own handlers run first; calling
 * preventDefault() in them skips the built-in behaviour.
 */
export function useDialog(
  open: boolean,
  onClose: () => void,
  dismissible: boolean,
  handlers: Partial<DialogHandlers>,
) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const pressedOutside = useRef(false);
  const openRef = useRef(open);
  const onCloseRef = useRef(onClose);
  useIsomorphicLayoutEffect(() => {
    openRef.current = open;
    onCloseRef.current = onClose;
  });

  const restoreFocus = useCallback(() => {
    const target = returnTo.current;
    returnTo.current = null;
    if (target?.isConnected) target.focus({ preventScroll: true });
  }, []);

  useIsomorphicLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      const active = document.activeElement;
      returnTo.current = active instanceof HTMLElement ? active : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      restoreFocus();
    }
  }, [open, restoreFocus]);

  // Unmounted while open: the top layer goes with the node, focus comes back.
  useEffect(() => restoreFocus, [restoreFocus]);

  const props: DialogHandlers = {
    onCancel: (event) => {
      handlers.onCancel?.(event);
      const skip = event.defaultPrevented;
      // Escape: the parent decides through `open`.
      event.preventDefault();
      if (dismissible && !skip) onCloseRef.current();
    },
    onClose: (event) => {
      handlers.onClose?.(event);
      // Closed natively (form method="dialog", a forced Escape): sync up.
      restoreFocus();
      if (openRef.current) onCloseRef.current();
    },
    onPointerDown: (event) => {
      handlers.onPointerDown?.(event);
      pressedOutside.current =
        event.target === event.currentTarget &&
        outside(event.currentTarget, event.clientX, event.clientY);
    },
    onClick: (event) => {
      handlers.onClick?.(event);
      const wasOutside = pressedOutside.current;
      pressedOutside.current = false;
      if (event.defaultPrevented || !dismissible) return;
      // A press that started inside and ended on the backdrop is a drag.
      if (
        event.target === event.currentTarget &&
        wasOutside &&
        outside(event.currentTarget, event.clientX, event.clientY)
      )
        onCloseRef.current();
    },
  };
  return { ref, props };
}
