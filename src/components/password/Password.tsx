"use client";
import { forwardRef, useState } from "react";
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

// One eye that opens and closes: lids, pupil and lashes are separate shapes
// so CSS can animate them (lucide's eye proportions; the closed state is
// the lower lid with lashes, like lucide's eye-closed). Hidden =
// closed with lashes; shown = open.
function EyeGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g className="cherry-password__eye">
        <path
          className="cherry-password__lid"
          d="M2 12C5.5 2.67 18.5 2.67 22 12"
        />
        <path d="M2 12C5.5 21.33 18.5 21.33 22 12" />
        <circle className="cherry-password__pupil" cx="12" cy="12" r="3" />
        <g className="cherry-password__lashes">
          <path d="M3.8 15.17 1.79 16.81" />
          <path d="M8.82 18.52 8.06 21" />
          <path d="M15.18 18.52 15.94 21" />
          <path d="M20.2 15.17 22.21 16.81" />
        </g>
      </g>
    </svg>
  );
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
                <EyeGlyph />
              </span>
            }
          />
        }
      />
    );
  },
);
