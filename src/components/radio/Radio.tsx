"use client";
import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useMemo,
  useState,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cx } from "../../utils/cx";
import { useFieldControl, useFieldGroupLabel } from "../field/field-context";
import type { RadioOrientation, RadioSize } from "./variants.gen";

interface RadioGroupContextValue {
  name: string;
  value: string | null;
  setValue: (value: string) => void;
  size: RadioSize;
  invalid: boolean;
  disabled: boolean;
  required: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type" | "value"
> {
  /** The value submitted, and matched against the group's value. */
  value: string;
  /** Visible label. Omit only when an aria-label is given. */
  label?: ReactNode;
  /** 16 / 18 / 20 px. Inherits the group's size. */
  size?: RadioSize;
  /** Error state. Inherits the group's (or <Field>'s) state. */
  invalid?: boolean;
  /** Class for the outer <label> (className goes to the <input>). */
  wrapperClassName?: string;
}

/**
 * Radio on a native <input type="radio">. Inside a <RadioGroup> it takes the
 * group's name, value, size and state; arrow keys move between options
 * natively. The dot scales in.
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  {
    value,
    label,
    size,
    invalid,
    wrapperClassName,
    className,
    style,
    onChange,
    ...props
  },
  ref,
) {
  const group = useContext(RadioGroupContext);
  const isInvalid =
    invalid ??
    (props["aria-invalid"] === true || props["aria-invalid"] === "true"
      ? true
      : (group?.invalid ?? false));
  const disabled = props.disabled ?? group?.disabled ?? false;
  const resolvedSize = size ?? group?.size ?? "md";
  const groupProps = group
    ? {
        name: props.name ?? group.name,
        checked: props.checked ?? group.value === value,
        required: props.required ?? (group.required || undefined),
      }
    : {};

  return (
    <label
      className={cx("cherry-radio", wrapperClassName)}
      data-size={resolvedSize}
      data-invalid={isInvalid || undefined}
      data-disabled={disabled || undefined}
      style={style}
    >
      <span className="cherry-radio__control">
        <input
          ref={ref}
          type="radio"
          className={cx("cherry-radio__input", className)}
          value={value}
          {...props}
          {...groupProps}
          disabled={disabled || undefined}
          aria-invalid={(!group && isInvalid) || undefined}
          onChange={(event) => {
            onChange?.(event);
            if (!event.defaultPrevented && event.target.checked)
              group?.setValue(value);
          }}
        />
        <span className="cherry-radio__dot" aria-hidden="true" />
      </span>
      {label ? <span className="cherry-radio__label">{label}</span> : null}
    </label>
  );
});

export interface RadioGroupProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  /** Shared input name (generated when omitted). */
  name?: string;
  /** Controlled selected value. */
  value?: string | null;
  /** Initial value when uncontrolled. */
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  size?: RadioSize;
  /** Stack direction. Defaults to "vertical". */
  orientation?: RadioOrientation;
  /** Error state; set automatically inside a <Field error>. */
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
}

/**
 * A set of <Radio> options (role="radiogroup"). Name it with aria-label or
 * aria-labelledby (or a <Field> label).
 */
export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  function RadioGroup(
    {
      name,
      value,
      defaultValue = null,
      onValueChange,
      size = "md",
      orientation = "vertical",
      invalid,
      disabled,
      required,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const autoName = useId();
    const [uncontrolled, setUncontrolled] = useState(defaultValue);
    const controlled = value !== undefined;
    const current = controlled ? value : uncontrolled;

    const control = useFieldControl({
      ...rest,
      "aria-invalid": invalid ? true : rest["aria-invalid"],
      disabled,
      required,
    });
    const {
      disabled: isDisabled,
      required: isRequired,
      ...groupAttrs
    } = control;
    const isInvalid =
      control["aria-invalid"] === true || control["aria-invalid"] === "true";

    const ctx = useMemo<RadioGroupContextValue>(
      () => ({
        name: name ?? `cherry-radio-${autoName}`,
        value: current,
        setValue: (next) => {
          if (!controlled) setUncontrolled(next);
          onValueChange?.(next);
        },
        size,
        invalid: isInvalid,
        disabled: Boolean(isDisabled),
        required: Boolean(isRequired),
      }),
      [
        name,
        autoName,
        current,
        controlled,
        onValueChange,
        size,
        isInvalid,
        isDisabled,
        isRequired,
      ],
    );

    const groupLabel = useFieldGroupLabel(rest);

    return (
      <div
        ref={ref}
        role="radiogroup"
        className={cx("cherry-radio-group", className)}
        data-size={size}
        data-orientation={orientation}
        data-invalid={isInvalid || undefined}
        data-disabled={isDisabled || undefined}
        aria-disabled={isDisabled || undefined}
        aria-required={isRequired || undefined}
        {...groupAttrs}
        aria-labelledby={groupLabel}
        aria-invalid={isInvalid || undefined}
      >
        <RadioGroupContext.Provider value={ctx}>
          {children}
        </RadioGroupContext.Provider>
      </div>
    );
  },
);
