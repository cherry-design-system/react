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
  | "space-between"
  | "space-around"
  | "space-evenly";
export type FlexAlign =
  "stretch" | "flex-start" | "center" | "flex-end" | "baseline";
export type FlexWrap = "wrap" | "nowrap" | "wrap-reverse";

export interface FlexProps extends HTMLAttributes<HTMLDivElement> {
  /** Defaults to "row". */
  direction?: Responsive<FlexDirection>;
  /** Defaults to "flex-start". */
  justify?: Responsive<FlexJustify>;
  /** Defaults to "stretch". */
  align?: Responsive<FlexAlign>;
  /** Defaults to "wrap" (as in cherry 1.x). */
  wrap?: Responsive<FlexWrap>;
  /** Gap as a spacing step. Defaults to the gutter (20px, 40px from lg). */
  gap?: Responsive<SpaceStep>;
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
    wrap,
    gap,
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
    ...responsiveVars("gap", gap, space),
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
