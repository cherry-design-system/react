import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "../../utils/cx";
import type { IconButtonSize, IconButtonVariant } from "./variants.gen";

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  /** Required: icon-only buttons need an accessible name. */
  "aria-label": string;
  /** The icon element (e.g. <X />). */
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

/** Square icon-only button. Pass aria-pressed for toggle behaviour. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { icon, variant = "ghost", size = "md", className, type, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={cx("cherry-icon-button", className)}
        data-variant={variant}
        data-size={size}
        {...rest}
      >
        {icon}
      </button>
    );
  },
);
