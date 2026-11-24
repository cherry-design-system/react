import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";
import type { SkeletonShape } from "./variants.gen";

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  /** `text` (lines), `circle` (avatar) or `rect` (media, cards). */
  shape?: SkeletonShape;
  /** CSS width (number = px). Text defaults to full width, circle to 40px. */
  width?: number | string;
  /** CSS height (number = px). Circle uses the width when omitted. */
  height?: number | string;
  /** Number of text lines; the last one is shorter. Defaults to 1. */
  lines?: number;
}

const size = (v: number | string | undefined) =>
  typeof v === "number" ? `${v}px` : v;

/**
 * Loading placeholder with a shimmer. Decorative (aria-hidden): mark the
 * region that is loading with aria-busy instead.
 * No client JS: safe in Server Components.
 */
export const Skeleton = forwardRef<HTMLSpanElement, SkeletonProps>(
  function Skeleton(
    { shape = "text", width, height, lines = 1, className, style, ...rest },
    ref,
  ) {
    const vars = {
      ...style,
      "--_w": size(width),
      "--_h": size(height),
    } as CSSProperties;
    const count = shape === "text" ? Math.max(1, Math.floor(lines)) : 0;
    return (
      <span
        ref={ref}
        aria-hidden="true"
        className={cx("cherry-skeleton", className)}
        data-shape={shape}
        style={vars}
        {...rest}
      >
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className="cherry-skeleton__line" />
        ))}
      </span>
    );
  },
);
