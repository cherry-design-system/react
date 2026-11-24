"use client";
import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cx } from "../../utils/cx";
import { useFieldControl } from "../field/field-context";
import { IconButton } from "../icon-button";
import { Input, type InputProps } from "../input";
import type { PasswordSize } from "./variants.gen";

export interface PasswordProps extends Omit<
  InputProps,
  "type" | "suffix" | "size"
> {
  size?: PasswordSize;
  /** Controlled visibility of the value. */
  visible?: boolean;
  /** Initial visibility when uncontrolled. */
  defaultVisible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  /** Name of the show/hide button (a toggle: aria-pressed carries the state). */
  toggleLabel?: string;
}

/** Password input with a show/hide toggle. */
export const Password = forwardRef<HTMLInputElement, PasswordProps>(
  function Password(
    {
      size = "md",
      visible,
      defaultVisible = false,
      onVisibleChange,
      toggleLabel = "Show password",
      wrapperClassName,
      invalid,
      ...props
    },
    ref,
  ) {
    const [uncontrolled, setUncontrolled] = useState(defaultVisible);
    const shown = visible ?? uncontrolled;
    // Read the Field state too, so the wrapper can style the toggle.
    const control = useFieldControl({ ...props });
    const disabled = Boolean(control.disabled);

    const toggle = () => {
      const next = !shown;
      if (visible === undefined) setUncontrolled(next);
      onVisibleChange?.(next);
    };

    return (
      <Input
        ref={ref}
        size={size}
        invalid={invalid}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        {...props}
        type={shown ? "text" : "password"}
        wrapperClassName={cx("cherry-password", wrapperClassName)}
        suffix={
          <IconButton
            className="cherry-password__toggle"
            size={size === "lg" ? "md" : "sm"}
            aria-label={toggleLabel}
            aria-pressed={shown}
            aria-controls={control.id}
            title={toggleLabel}
            disabled={disabled}
            onClick={toggle}
            icon={
              <span className="cherry-password__icon" aria-hidden="true">
                <Eye className="cherry-password__icon-show" />
                <EyeOff className="cherry-password__icon-hide" />
              </span>
            }
          />
        }
      />
    );
  },
);
