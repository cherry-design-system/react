import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "../../utils/cx";
import type { ToggleSize } from "./variants.gen";

export interface ToggleProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type"
> {
  /** Visible label. Omit only when an aria-label is given. */
  label?: ReactNode;
  size?: ToggleSize;
  invalid?: boolean;
}

/**
 * On/off switch built on a native checkbox with role="switch": it submits
 * and resets with forms, and works without client JS (uncontrolled), so it
 * renders in Server Components. Use `checked` + `onChange` for controlled use.
 */
export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(function Toggle(
  { label, size = "md", invalid, className, style, ...rest },
  ref,
) {
  return (
    <label
      className={cx("cherry-toggle", className)}
      data-size={size}
      data-invalid={invalid || undefined}
      style={style}
    >
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        className="cherry-toggle__input"
        aria-invalid={invalid || undefined}
        {...rest}
      />
      <span className="cherry-toggle__track" aria-hidden="true">
        <span className="cherry-toggle__thumb" />
      </span>
      {label ? <span className="cherry-toggle__label">{label}</span> : null}
    </label>
  );
});
