import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";
import type { BadgeSize, BadgeVariant } from "./variants.gen";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Leading status dot in the text color. */
  dot?: boolean;
}

/** Status pill. Use Tag for removable values. */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = "neutral", size = "md", dot, className, children, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={cx("cherry-badge", className)} data-variant={variant} data-size={size} {...rest}>
      {dot ? <span className="cherry-badge__dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
});
