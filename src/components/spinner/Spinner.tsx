import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";
import type { SpinnerSize } from "./variants.gen";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  /** Accessible label. Pass null when a parent already announces the busy state. */
  label?: string | null;
}

/** Spinning LoaderCircle (lucide geometry, inlined so no icon import is needed). */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = "sm", label = "Loading", className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx("cherry-spinner", className)}
      data-size={size}
      role={label ? "status" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      {...rest}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </span>
  );
});
