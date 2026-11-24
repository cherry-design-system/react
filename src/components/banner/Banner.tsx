"use client";
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type TransitionEvent,
} from "react";
import { X } from "lucide-react";
import { cx } from "../../utils/cx";
import type { BannerVariant } from "./variants.gen";

export interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  /** `inverse` (default), `accent` or `subtle`. */
  variant?: BannerVariant;
  /** Leading icon (e.g. <Megaphone />). */
  icon?: ReactNode;
  /** Trailing link or button after the message. */
  action?: ReactNode;
  /** Shows a close button; the banner collapses, then `onDismiss` runs. */
  dismissible?: boolean;
  onDismiss?: () => void;
  /** Close button label (translate here). Defaults to "Dismiss". */
  dismissLabel?: string;
  /** Region name (translate here). Defaults to "Announcement". */
  "aria-label"?: string;
}

/** Past the exit (instant delay + base collapse): fallback when transitionend never fires. */
const EXIT_FALLBACK_MS = 600;

/**
 * Full-width announcement bar. It fades in on mount; dismissing fades it and
 * collapses its height to zero, then removes it and calls `onDismiss`.
 */
export const Banner = forwardRef<HTMLDivElement, BannerProps>(function Banner(
  {
    variant = "inverse",
    icon,
    action,
    dismissible,
    onDismiss,
    dismissLabel = "Dismiss",
    className,
    children,
    onTransitionEnd,
    "aria-label": ariaLabel = "Announcement",
    ...rest
  },
  ref,
) {
  const [state, setState] = useState<"shown" | "leaving" | "gone">("shown");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const leaving = useRef(false);

  // Runs once per dismissal: on the collapse's transitionend, or from the
  // fallback timer when no transition runs (e.g. display: none ancestors).
  const finish = () => {
    if (!leaving.current) return;
    leaving.current = false;
    clearTimeout(timer.current);
    setState("gone");
    onDismiss?.();
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  if (state === "gone") return null;

  return (
    <div
      ref={ref}
      role="region"
      aria-label={ariaLabel}
      className={cx("cherry-banner", className)}
      data-variant={variant}
      data-dismissed={state === "leaving" || undefined}
      onTransitionEnd={(event: TransitionEvent<HTMLDivElement>) => {
        onTransitionEnd?.(event);
        if (
          event.target === event.currentTarget &&
          event.propertyName === "grid-template-rows"
        )
          finish();
      }}
      {...rest}
    >
      <div className="cherry-banner__inner">
        <div className="cherry-banner__content">
          {icon ? (
            <span className="cherry-banner__icon" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <span className="cherry-banner__message">{children}</span>
          {action ? (
            <span className="cherry-banner__action">{action}</span>
          ) : null}
        </div>
        {dismissible ? (
          <button
            type="button"
            className="cherry-banner__dismiss"
            aria-label={dismissLabel}
            disabled={state !== "shown"}
            onClick={() => {
              leaving.current = true;
              setState("leaving");
              timer.current = setTimeout(finish, EXIT_FALLBACK_MS);
            }}
          >
            <X aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
});
