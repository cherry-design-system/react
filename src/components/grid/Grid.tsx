import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";
import {
  responsiveVars,
  space,
  withVars,
  type Responsive,
  type SpaceStep,
} from "../../utils/responsive";

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /** Equal columns, per breakpoint. Defaults to 3. */
  cols?: Responsive<number>;
  /** Gap as a spacing step. Defaults to the gutter (20px, 40px from lg). */
  gap?: Responsive<SpaceStep>;
}

/** CSS grid of equal columns. No client JS. */
export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid(
  { cols, gap, className, style, ...rest },
  ref,
) {
  const vars = {
    ...responsiveVars("cols", cols),
    ...responsiveVars("gap", gap, space),
  };
  return (
    <div
      ref={ref}
      className={cx("cherry-grid", className)}
      style={withVars(vars, style)}
      {...rest}
    />
  );
});

export type ColSpan = number | "full";

export interface ColProps extends HTMLAttributes<HTMLDivElement> {
  /** Columns to span, per breakpoint; "full" spans the whole row. */
  span?: Responsive<ColSpan>;
}

const toSpan = (span: ColSpan) => (span === "full" ? "1 / -1" : `span ${span}`);

/** A grid cell that spans several columns. No client JS. */
export const Col = forwardRef<HTMLDivElement, ColProps>(function Col(
  { span, className, style, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("cherry-col", className)}
      style={withVars(responsiveVars("span", span, toSpan), style)}
      {...rest}
    />
  );
});
