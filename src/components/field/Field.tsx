"use client";
import { forwardRef, useId, useMemo, type HTMLAttributes, type ReactNode } from "react";
import { CircleX } from "lucide-react";
import { cx } from "../../utils/cx";
import { FieldContext } from "./field-context";

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: ReactNode;
  /** Helper text under the control. Hidden while an error shows. */
  hint?: ReactNode;
  /** Error message. Marks the control aria-invalid and replaces the hint. */
  error?: ReactNode;
  /** The control's id (generated when omitted). */
  id?: string;
  disabled?: boolean;
  required?: boolean;
  children: ReactNode;
}

/** Label + control + hint/error, wired for assistive tech. */
export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
  { label, hint, error, id, disabled = false, required = false, className, children, ...rest },
  ref,
) {
  const autoId = useId();
  const controlId = id ?? `cherry-field-${autoId}`;
  const messageId = `${controlId}-message`;
  const invalid = Boolean(error);
  const hasMessage = invalid || Boolean(hint);
  const value = useMemo(
    () => ({ id: controlId, describedBy: hasMessage ? messageId : undefined, invalid, disabled, required }),
    [controlId, hasMessage, messageId, invalid, disabled, required],
  );
  return (
    <div ref={ref} className={cx("cherry-field", className)} data-invalid={invalid || undefined} data-disabled={disabled || undefined} {...rest}>
      <label className="cherry-field__label" htmlFor={controlId}>
        {label}
        {required ? (
          <span className="cherry-field__required" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <FieldContext.Provider value={value}>{children}</FieldContext.Provider>
      {invalid ? (
        <p className="cherry-field__error" id={messageId}>
          <CircleX aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="cherry-field__hint" id={messageId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
});
