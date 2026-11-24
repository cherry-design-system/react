import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../../utils/cx";
import type { SeparatorOrientation } from "./variants.gen";

export interface SeparatorProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** Defaults to "horizontal". */
  orientation?: SeparatorOrientation;
  /** Centered text on a horizontal rule ("OR"). */
  label?: ReactNode;
  /** Purely visual: hidden from assistive tech. Defaults to false. */
  decorative?: boolean;
}

/** A 1px rule, horizontal or vertical, optionally labelled. No client JS. */
export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  function Separator(
    { orientation = "horizontal", label, decorative, className, ...rest },
    ref,
  ) {
    const hasLabel = label !== undefined && orientation === "horizontal";
    return (
      <div
        ref={ref}
        className={cx("cherry-separator", className)}
        data-orientation={orientation}
        data-labelled={hasLabel || undefined}
        role={decorative ? "none" : "separator"}
        aria-orientation={
          decorative || orientation === "horizontal" ? undefined : orientation
        }
        {...rest}
      >
        {hasLabel ? (
          <span className="cherry-separator__label">{label}</span>
        ) : null}
      </div>
    );
  },
);
