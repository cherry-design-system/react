"use client";
import { forwardRef, type ReactNode, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "../../utils/cx";
import { useFieldControl } from "../field/field-context";
import type { SelectSize } from "./variants.gen";

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> {
  size?: SelectSize;
  /** Error state; set automatically inside a <Field error>. */
  invalid?: boolean;
  /** Text shown while no option is chosen (an empty, unselectable option). */
  placeholder?: string;
  /** Class for the outer wrapper (className goes to the <select>). */
  wrapperClassName?: string;
  children?: ReactNode;
}

/**
 * Native <select>. Where the browser supports `appearance: base-select` the
 * picker is styled and animated too; elsewhere the OS picker opens.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      size = "md",
      invalid,
      placeholder,
      wrapperClassName,
      className,
      children,
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
    // Without a value, a placeholder starts selected.
    const withPlaceholder =
      placeholder !== undefined &&
      props.value === undefined &&
      props.defaultValue === undefined &&
      !props.multiple
        ? { defaultValue: "" }
        : {};

    return (
      <div
        className={cx("cherry-select", wrapperClassName)}
        data-size={size}
        data-invalid={isInvalid || undefined}
        data-disabled={control.disabled || undefined}
      >
        <select
          ref={ref}
          className={cx("cherry-select__control", className)}
          {...withPlaceholder}
          {...control}
        >
          {placeholder !== undefined ? (
            <option value="" disabled hidden data-placeholder="">
              {placeholder}
            </option>
          ) : null}
          {children}
        </select>
        <ChevronDown className="cherry-select__chevron" aria-hidden="true" />
      </div>
    );
  },
);
