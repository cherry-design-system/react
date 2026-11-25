import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";
import {
  responsiveVars,
  space,
  withVars,
  type Responsive,
  type SpaceStep,
} from "../../utils/responsive";

export type FlexDirection = "row" | "column" | "row-reverse" | "column-reverse";
export type FlexJustify =
  | "flex-start"
  | "center"
  | "flex-end"
  | "start"
  | "end"
  | "space-between"
  | "space-around"
  | "space-evenly";
export type FlexAlign =
  | "stretch"
  | "flex-start"
  | "center"
  | "flex-end"
  | "start"
  | "end"
  | "baseline";
export type FlexAlignContent =
  | "normal"
  | "stretch"
  | "flex-start"
  | "center"
  | "flex-end"
  | "start"
  | "end"
  | "space-between"
  | "space-around"
  | "space-evenly";
export type FlexWrap = "wrap" | "nowrap" | "wrap-reverse";

export interface FlexProps extends HTMLAttributes<HTMLDivElement> {
  /** Defaults to "row". */
  direction?: Responsive<FlexDirection>;
  /** Defaults to "flex-start". */
  justify?: Responsive<FlexJustify>;
  /** Cross-axis alignment of the items (align-items). Defaults to "stretch". */
  align?: Responsive<FlexAlign>;
  /**
   * How wrapped lines share the cross axis (align-content). Only has an
   * effect when the items wrap onto more than one line. Defaults to "normal".
   */
  alignContent?: Responsive<FlexAlignContent>;
  /** Defaults to "wrap" (as in cherry 1.x). */
  wrap?: Responsive<FlexWrap>;
  /** Gap as a spacing step. Defaults to the gutter (20px, 40px from lg). */
  gap?: Responsive<SpaceStep>;
  /** Gap between lines only (row-gap). Defaults to `gap`. */
  rowGap?: Responsive<SpaceStep>;
  /** Gap between items on a line only (column-gap). Defaults to `gap`. */
  columnGap?: Responsive<SpaceStep>;
  /** display: inline-flex. */
  inline?: boolean;
  /** Stretch to the container width. */
  fullWidth?: boolean;
}

/** Flexbox row (or column) with responsive props. No client JS. */
export const Flex = forwardRef<HTMLDivElement, FlexProps>(function Flex(
  {
    direction,
    justify,
    align,
    alignContent,
    wrap,
    gap,
    rowGap,
    columnGap,
    inline,
    fullWidth,
    className,
    style,
    ...rest
  },
  ref,
) {
  const vars = {
    ...responsiveVars("direction", direction),
    ...responsiveVars("justify", justify),
    ...responsiveVars("align", align),
    ...responsiveVars("wrap", wrap),
    ...responsiveVars("align-content", alignContent),
    ...responsiveVars("gap", gap, space),
    ...responsiveVars("row-gap", rowGap, space),
    ...responsiveVars("column-gap", columnGap, space),
  };
  return (
    <div
      ref={ref}
      className={cx("cherry-flex", className)}
      data-inline={inline || undefined}
      data-full-width={fullWidth || undefined}
      style={withVars(vars, style)}
      {...rest}
    />
  );
});

export type StackProps = FlexProps;

/** A vertical Flex that does not wrap, with a 16px gap by default. */
export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  { direction = "column", wrap = "nowrap", gap = 4, ...rest },
  ref,
) {
  return (
    <Flex ref={ref} direction={direction} wrap={wrap} gap={gap} {...rest} />
  );
});
