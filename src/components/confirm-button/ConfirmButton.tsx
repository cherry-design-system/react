"use client";
import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Check, Trash2, X } from "lucide-react";
import { cx } from "../../utils/cx";
import { mergeRefs } from "../../utils/merge-refs";
import type { ConfirmButtonSize } from "./variants.gen";

export interface ConfirmButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "onClick"
> {
  /** Runs when the second step is confirmed. */
  onConfirm: () => void;
  /** Runs when the confirm step closes without confirming. */
  onCancel?: () => void;
  /** Trigger icon. Defaults to a trash can. */
  icon?: ReactNode;
  /** Accessible name of the trigger. Defaults to "Delete". */
  "aria-label"?: string;
  /** Name of the confirm button. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Name of the cancel button. Defaults to "Cancel". */
  cancelLabel?: string;
  /** Milliseconds before the confirm step closes by itself; 0 keeps it. */
  resetAfter?: number;
  size?: ConfirmButtonSize;
  /** Class for the outer wrapper (className goes to the trigger). */
  wrapperClassName?: string;
}

/**
 * Two-step destructive action. The first click opens a confirm / cancel pair
 * beside the trigger (the control widens to make room); it closes again on
 * cancel, Escape, or after `resetAfter` ms.
 */
export const ConfirmButton = forwardRef<HTMLButtonElement, ConfirmButtonProps>(
  function ConfirmButton(
    {
      onConfirm,
      onCancel,
      icon,
      "aria-label": ariaLabel = "Delete",
      confirmLabel = "Confirm",
      cancelLabel = "Cancel",
      resetAfter = 4000,
      size = "md",
      wrapperClassName,
      className,
      disabled,
      ...rest
    },
    ref,
  ) {
    const [confirming, setConfirming] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const confirmRef = useRef<HTMLButtonElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const panelId = `cherry-confirm-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

    useEffect(() => {
      if (!confirming || !resetAfter) return;
      const timer = window.setTimeout(() => {
        setConfirming(false);
        onCancel?.();
      }, resetAfter);
      return () => window.clearTimeout(timer);
    }, [confirming, resetAfter, onCancel]);

    // Leaving the control (focus moves elsewhere) also cancels.
    const onBlur = (event: FocusEvent<HTMLDivElement>) => {
      if (
        confirming &&
        event.relatedTarget &&
        !rootRef.current?.contains(event.relatedTarget as Node)
      ) {
        setConfirming(false);
        onCancel?.();
      }
    };

    // The panel is inert until the confirm state renders; focus it then.
    const focusConfirm = useRef(false);
    useEffect(() => {
      if (!confirming || !focusConfirm.current) return;
      focusConfirm.current = false;
      confirmRef.current?.focus();
    }, [confirming]);

    const open = () => {
      focusConfirm.current = true;
      setConfirming(true);
    };
    const cancel = () => {
      setConfirming(false);
      triggerRef.current?.focus();
      onCancel?.();
    };
    const confirm = () => {
      setConfirming(false);
      triggerRef.current?.focus();
      onConfirm();
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape" && confirming) {
        event.stopPropagation();
        cancel();
      }
    };

    return (
      <div
        ref={rootRef}
        className={cx("cherry-confirm-button", wrapperClassName)}
        data-size={size}
        data-state={confirming ? "confirm" : "idle"}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      >
        <button
          ref={mergeRefs(ref, triggerRef)}
          type="button"
          className={cx("cherry-confirm-button__trigger", className)}
          aria-label={ariaLabel}
          aria-expanded={confirming}
          aria-controls={panelId}
          disabled={disabled}
          onClick={confirming ? cancel : open}
          {...rest}
        >
          <span className="cherry-confirm-button__glyph" aria-hidden="true">
            {icon ?? <Trash2 />}
          </span>
        </button>
        <div className="cherry-confirm-button__clip">
          <div
            id={panelId}
            role="group"
            aria-label={ariaLabel}
            className="cherry-confirm-button__panel"
            inert={!confirming || undefined}
          >
            <button
              ref={confirmRef}
              type="button"
              className="cherry-confirm-button__action"
              data-action="confirm"
              aria-label={confirmLabel}
              title={confirmLabel}
              onClick={confirm}
            >
              <Check aria-hidden="true" />
            </button>
            <button
              type="button"
              className="cherry-confirm-button__action"
              data-action="cancel"
              aria-label={cancelLabel}
              title={cancelLabel}
              onClick={cancel}
            >
              <X aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  },
);
