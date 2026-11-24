import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";

export type InlineCodeProps = HTMLAttributes<HTMLElement>;

/** Inline <code> chip in the mono type. No client JS. */
export const InlineCode = forwardRef<HTMLElement, InlineCodeProps>(
  function InlineCode({ className, ...rest }, ref) {
    return (
      <code
        ref={ref}
        className={cx("cherry-inline-code", className)}
        {...rest}
      />
    );
  },
);
