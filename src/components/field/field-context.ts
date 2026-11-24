"use client";
import { createContext, useContext, type AriaAttributes } from "react";

export interface FieldControlContext {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
  disabled: boolean;
  required: boolean;
}

export const FieldContext = createContext<FieldControlContext | null>(null);

/**
 * Props a control inside <Field> should spread (id, aria-describedby,
 * aria-invalid, disabled, required). Explicit props on the control win.
 */
export function useFieldControl<T extends { id?: string; "aria-describedby"?: string; "aria-invalid"?: AriaAttributes["aria-invalid"]; disabled?: boolean; required?: boolean }>(
  props: T,
): T {
  const field = useContext(FieldContext);
  if (!field) return props;
  return {
    ...props,
    id: props.id ?? field.id,
    "aria-describedby": props["aria-describedby"] ?? field.describedBy,
    "aria-invalid": props["aria-invalid"] ?? (field.invalid || undefined),
    disabled: props.disabled ?? (field.disabled || undefined),
    required: props.required ?? (field.required || undefined),
  };
}
