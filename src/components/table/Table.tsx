import {
  forwardRef,
  type CSSProperties,
  type TableHTMLAttributes,
} from "react";
import { cx } from "../../utils/cx";
import type { TableSize } from "./variants.gen";

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  /** Row density. Defaults to "md". */
  size?: TableSize;
  /** Zebra rows. */
  striped?: boolean;
  /** Highlight rows on hover. Defaults to true. */
  hoverable?: boolean;
  /** Names the scroll region (makes it keyboard scrollable) when the table can overflow. */
  scrollLabel?: string;
  /** Class for the outer frame (className goes on the <table>). */
  frameClassName?: string;
  frameStyle?: CSSProperties;
}

/**
 * A native <table> in a rounded, horizontally scrollable frame. Write plain
 * thead / tbody / tr / th / td inside; mark number columns with
 * `data-numeric` on their th and td to right-align them in tabular figures.
 * No client JS.
 */
export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  {
    size = "md",
    striped,
    hoverable = true,
    scrollLabel,
    frameClassName,
    frameStyle,
    className,
    ...rest
  },
  ref,
) {
  return (
    <div
      className={cx("cherry-table", frameClassName)}
      style={frameStyle}
      data-size={size}
      data-striped={striped || undefined}
      data-hoverable={hoverable || undefined}
      role={scrollLabel ? "region" : undefined}
      aria-label={scrollLabel}
      tabIndex={scrollLabel ? 0 : undefined}
    >
      <table
        ref={ref}
        className={cx("cherry-table__table", className)}
        {...rest}
      />
    </div>
  );
});
