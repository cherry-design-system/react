"use client";
import {
  forwardRef,
  useId,
  type DialogHTMLAttributes,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cx } from "../../utils/cx";
import { IconButton } from "../icon-button";
import { useDialog, useMergedRef } from "./use-dialog";
import type { ModalSize } from "./variants.gen";

export interface ModalProps extends Omit<
  DialogHTMLAttributes<HTMLDialogElement>,
  "open" | "title" | "onClose"
> {
  /** Controlled open state. */
  open: boolean;
  /** Asked on Escape, a backdrop click or the close button. Set `open` to false here. */
  onClose: () => void;
  /** Heading; also the dialog's accessible name. */
  title?: ReactNode;
  /** Line under the title; wired as the accessible description. */
  description?: ReactNode;
  /** 400 / 480 / 640 px wide. Defaults to "md". */
  size?: ModalSize;
  /** Hide the close button in the header. */
  hideClose?: boolean;
  /** Accessible name of the close button. Defaults to "Close". */
  closeLabel?: string;
  /** Escape and backdrop clicks close it. Defaults to true. */
  dismissible?: boolean;
}

/**
 * A modal dialog on the native <dialog> (showModal): focus trap, top layer,
 * inert page and Escape come from the platform. Fades and scales in over a
 * fading backdrop; the exit plays in CSS. Compose the content with
 * <ModalBody> and <ModalFooter>.
 */
export const Modal = forwardRef<HTMLDialogElement, ModalProps>(function Modal(
  {
    open,
    onClose,
    title,
    description,
    size = "md",
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
  const hasHeader = Boolean(title || description || !hideClose);
  return (
    <dialog
      ref={setRef}
      className={cx("cherry-modal", className)}
      data-size={size}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      {...rest}
      {...props}
    >
      {hasHeader ? (
        <header className="cherry-modal__header">
          {title ? (
            <h2 className="cherry-modal__title" id={titleId}>
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="cherry-modal__description" id={descriptionId}>
              {description}
            </p>
          ) : null}
          {hideClose ? null : (
            <IconButton
              className="cherry-modal__close"
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
