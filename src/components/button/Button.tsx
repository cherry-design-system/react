import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "../../utils/cx";
import { Spinner } from "../spinner";
import type { ButtonSize, ButtonVariant } from "./variants.gen";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. Defaults to "primary". */
  variant?: ButtonVariant;
  /** 32 / 36 / 44 px. Defaults to "md". */
  size?: ButtonSize;
  /** Icon before the label (e.g. a lucide icon element). */
  leadingIcon?: ReactNode;
  /** Icon after the label. */
  trailingIcon?: ReactNode;
  /** Stretch to the container width. */
  fullWidth?: boolean;
  /** Shows a spinner in place of the leading icon, sets aria-busy and blocks clicks. */
  loading?: boolean;
}

/** A button. No client JS: safe in React Server Components. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      leadingIcon,
      trailingIcon,
      fullWidth,
      loading,
      className,
      children,
      type,
      disabled,
      onClick,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={cx("cherry-button", className)}
        data-variant={variant}
        data-size={size}
        data-full-width={fullWidth || undefined}
        data-loading={loading || undefined}
        aria-busy={loading || undefined}
        aria-disabled={loading || undefined}
        disabled={disabled}
        onClick={loading ? (event) => event.preventDefault() : onClick}
        {...rest}
      >
        {loading ? (
          <span className="cherry-button__icon">
            <Spinner size={size === "lg" ? "md" : "sm"} label={null} />
          </span>
        ) : leadingIcon ? (
          <span className="cherry-button__icon" aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}
        <span className="cherry-button__label">{children}</span>
        {trailingIcon ? (
          <span className="cherry-button__icon" aria-hidden="true">
            {trailingIcon}
          </span>
        ) : null}
      </button>
    );
  },
);
