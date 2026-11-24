"use client";
import {
  forwardRef,
  useId,
  type DialogHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cx } from "../../utils/cx";
import { IconButton } from "../icon-button";
import { useDialog, useMergedRef } from "../modal/use-dialog";
import type { SheetSide } from "./variants.gen";

export interface SheetProps extends Omit<
  DialogHTMLAttributes<HTMLDialogElement>,
  "open" | "title" | "onClose"
> {
  /** Controlled open state. */
  open: boolean;
  /** Asked on Escape, a backdrop click or the close button. */
  onClose: () => void;
  /** Edge it slides from. Defaults to "right". */
  side?: SheetSide;
  /** Heading; also the dialog's accessible name. */
  title?: ReactNode;
  /** Line under the title; wired as the accessible description. */
  description?: ReactNode;
  /** Hide the close button in the header. */
  hideClose?: boolean;
  /** Accessible name of the close button. Defaults to "Close". */
  closeLabel?: string;
  /** Escape and backdrop clicks close it. Defaults to true. */
  dismissible?: boolean;
}

/**
 * A panel sliding in from an edge, on the native <dialog> (showModal). It
 * slides back out in CSS when closed. Compose with <SheetBody> (scrolls)
 * and <SheetFooter> (pinned to the bottom).
 */
export const Sheet = forwardRef<HTMLDialogElement, SheetProps>(function Sheet(
  {
    open,
    onClose,
    side = "right",
    title,
    description,
    hideClose,
    closeLabel = "Close",
    dismissible = true,
    className,
    children,
    onCancel,
    onPointerDown,
    onClick,
    ...rest
  },
  forwarded,
) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const { ref, props } = useDialog(open, onClose, dismissible, {
    onCancel,
    onPointerDown,
    onClick,
  });
  const setRef = useMergedRef(ref, forwarded);
  return (
    <dialog
      ref={setRef}
      className={cx("cherry-sheet", className)}
      data-side={side}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      {...rest}
      {...props}
    >
      {side === "bottom" ? (
        <span className="cherry-sheet__handle" aria-hidden="true" />
      ) : null}
      {title || description || !hideClose ? (
        <header className="cherry-sheet__header">
          {title ? (
            <h2 className="cherry-sheet__title" id={titleId}>
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="cherry-sheet__description" id={descriptionId}>
              {description}
            </p>
          ) : null}
          {hideClose ? null : (
            <IconButton
              className="cherry-sheet__close"
              size="sm"
              aria-label={closeLabel}
              icon={<X aria-hidden="true" />}
              onClick={onClose}
            />
          )}
        </header>
      ) : null}
      {children}
    </dialog>
  );
});

export type SheetBodyProps = HTMLAttributes<HTMLDivElement>;
export type SheetFooterProps = HTMLAttributes<HTMLDivElement>;

/** Scrolling content area of a <Sheet>. */
export const SheetBody = forwardRef<HTMLDivElement, SheetBodyProps>(
  function SheetBody({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cx("cherry-sheet__body", className)}
        {...rest}
      />
    );
  },
);

/** Action row pinned to the bottom of a <Sheet>, above a divider. */
export const SheetFooter = forwardRef<HTMLDivElement, SheetFooterProps>(
  function SheetFooter({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cx("cherry-sheet__footer", className)}
        {...rest}
      />
    );
  },
);
