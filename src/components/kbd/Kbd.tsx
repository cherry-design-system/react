import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";
import type { KbdSize } from "./variants.gen";

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  /** 20 / 24 px tall. Defaults to "md". */
  size?: KbdSize;
}

/**
 * A keyboard key chip (<kbd>): text ("esc", "⌘K") or an icon (<ArrowUp />).
 * Give an icon-only key an aria-label. No client JS.
 */
export const Kbd = forwardRef<HTMLElement, KbdProps>(function Kbd(
  { size = "md", className, ...rest },
  ref,
) {
  return (
    <kbd
      ref={ref}
      className={cx("cherry-kbd", className)}
      data-size={size}
      {...rest}
    />
  );
});
