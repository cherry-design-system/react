import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";
import {
  responsiveVars,
  space,
  withVars,
  type Responsive,
  type SpaceStep,
} from "../../utils/responsive";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Full width instead of the container max width. */
  fluid?: boolean;
  /** Padding on every side (as in 1.x), as a spacing step. Defaults to 20px, 40px from lg. */
  padding?: Responsive<SpaceStep>;
}

/** Centered page column. No client JS. */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  function Container({ fluid, padding, className, style, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cx("cherry-container", className)}
        data-fluid={fluid || undefined}
        style={withVars(responsiveVars("padding", padding, space), style)}
        {...rest}
      />
    );
  },
);
