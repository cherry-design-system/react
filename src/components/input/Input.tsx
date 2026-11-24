"use client";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "../../utils/cx";
import { useFieldControl } from "../field/field-context";
import type { InputSize } from "./variants.gen";

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  size?: InputSize;
  /** Icon before the text (e.g. <Search />). */
  leadingIcon?: ReactNode;
  /** Element after the text (icon, unit, button). */
  suffix?: ReactNode;
  /** Error state; set automatically inside a <Field error>. */
  invalid?: boolean;
  /** Class for the outer wrapper (className goes to the <input>). */
  wrapperClassName?: string;
}

/** Text input. The ref and every native prop go to the <input>. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = "md",
    leadingIcon,
    suffix,
    invalid,
    wrapperClassName,
    className,
    ...props
  },
  ref,
) {
  const control = useFieldControl({
    ...props,
    "aria-invalid": invalid ? true : props["aria-invalid"],
  });
  const isInvalid =
    control["aria-invalid"] === true || control["aria-invalid"] === "true";
  return (
    <div
      className={cx("cherry-input", wrapperClassName)}
      data-size={size}
      data-invalid={isInvalid || undefined}
      data-disabled={control.disabled || undefined}
    >
      {leadingIcon ? (
        <span className="cherry-input__icon" aria-hidden="true">
          {leadingIcon}
        </span>
      ) : null}
      <input
        ref={ref}
        className={cx("cherry-input__control", className)}
        {...control}
      />
      {suffix ? <span className="cherry-input__suffix">{suffix}</span> : null}
    </div>
  );
});
