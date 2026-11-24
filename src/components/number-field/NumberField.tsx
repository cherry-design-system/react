"use client";
import {
  forwardRef,
  useEffect,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from "react";
import { Minus, Plus } from "lucide-react";
import { cx } from "../../utils/cx";
import { useFieldControl } from "../field/field-context";
import type { NumberFieldSize } from "./variants.gen";

export interface NumberFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type" | "value" | "defaultValue" | "min" | "max" | "step"
> {
  /** Controlled value (null = empty). */
  value?: number | null;
  /** Initial value when uncontrolled. */
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  /** Arrow / button increment. Defaults to 1. */
  step?: number;
  /** PageUp / PageDown increment. Defaults to step * 10. */
  largeStep?: number;
  size?: NumberFieldSize;
  /** Error state; set automatically inside a <Field error>. */
  invalid?: boolean;
  /** Names of the stepper buttons (translate here). */
  decrementLabel?: string;
  incrementLabel?: string;
  /** Class for the outer wrapper (className goes to the <input>). */
  wrapperClassName?: string;
}

function decimals(n: number | undefined) {
  if (n === undefined || !Number.isFinite(n)) return 0;
  const s = String(n);
  const i = s.indexOf(".");
  return i === -1 ? 0 : s.length - i - 1;
}

/**
 * Numeric input with decrement / increment buttons (role="spinbutton").
 * Arrow keys step, PageUp/PageDown take large steps, Home/End jump to
 * min/max. Typed text commits on blur or Enter, clamped and snapped.
 */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  function NumberField(
    {
      value,
      defaultValue = null,
      onValueChange,
      min,
      max,
      step = 1,
      largeStep,
      size = "md",
      invalid,
      decrementLabel = "Decrease",
      incrementLabel = "Increase",
      wrapperClassName,
      className,
      onKeyDown,
      onBlur,
      onChange,
      ...props
    },
    ref,
  ) {
    const [uncontrolled, setUncontrolled] = useState(defaultValue);
    const current = value !== undefined ? value : uncontrolled;
    const [draft, setDraft] = useState<string | null>(null);
    // A new controlled value replaces whatever is being typed.
    useEffect(() => setDraft(null), [value]);

    const precision = Math.max(decimals(step), decimals(min));
    const normalize = (n: number) => {
      let next = n;
      if (max !== undefined) next = Math.min(max, next);
      if (min !== undefined) next = Math.max(min, next);
      return Number(next.toFixed(precision));
    };
    const commit = (next: number | null) => {
      const final = next === null ? null : normalize(next);
      setDraft(null);
      if (final === current) return;
      if (value === undefined) setUncontrolled(final);
      onValueChange?.(final);
    };
    const parse = (text: string): number | null => {
      const t = text.trim().replace(",", ".");
      if (t === "") return null;
      const n = Number(t);
      return Number.isFinite(n) ? n : current;
    };

    // Steps from what is typed, if anything, so a click never loses input.
    const stepBy = (delta: number) => {
      const pending = draft !== null ? parse(draft) : current;
      commit(pending === null ? (min ?? 0) : pending + delta);
    };

    const control = useFieldControl({
      ...props,
      "aria-invalid": invalid ? true : props["aria-invalid"],
    });
    const isInvalid =
      control["aria-invalid"] === true || control["aria-invalid"] === "true";
    const disabled = Boolean(control.disabled);
    const readOnly = Boolean(props.readOnly);
    const locked = disabled || readOnly;
    const atMin = current !== null && min !== undefined && current <= min;
    const atMax = current !== null && max !== undefined && current >= max;

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || locked) return;
      const big = largeStep ?? step * 10;
      const from = (delta: number) => {
        event.preventDefault();
        stepBy(delta);
      };
      switch (event.key) {
        case "ArrowUp":
          return from(step);
        case "ArrowDown":
          return from(-step);
        case "PageUp":
          return from(big);
        case "PageDown":
          return from(-big);
        case "Home":
          if (min !== undefined) {
            event.preventDefault();
            commit(min);
          }
          return;
        case "End":
          if (max !== undefined) {
            event.preventDefault();
            commit(max);
          }
          return;
        case "Enter":
          if (draft !== null) commit(parse(draft));
          return;
      }
    };

    const text = draft ?? (current === null ? "" : current.toFixed(precision));

    return (
      <div
        className={cx("cherry-number-field", wrapperClassName)}
        data-size={size}
        data-invalid={isInvalid || undefined}
        data-disabled={disabled || undefined}
      >
        <button
          type="button"
          tabIndex={-1}
          className="cherry-number-field__button cherry-number-field__decrement"
          aria-label={decrementLabel}
          aria-controls={control.id}
          disabled={locked || atMin}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => stepBy(-step)}
        >
          <Minus aria-hidden="true" />
        </button>
        <input
          ref={ref}
          type="text"
          role="spinbutton"
          inputMode={precision > 0 || (min ?? -1) < 0 ? "decimal" : "numeric"}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={cx("cherry-number-field__input", className)}
          aria-valuenow={current ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          {...control}
          value={text}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setDraft(event.target.value);
            onChange?.(event);
          }}
          onBlur={(event: FocusEvent<HTMLInputElement>) => {
            if (draft !== null) commit(parse(draft));
            onBlur?.(event);
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          tabIndex={-1}
          className="cherry-number-field__button cherry-number-field__increment"
          aria-label={incrementLabel}
          aria-controls={control.id}
          disabled={locked || atMax}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => stepBy(step)}
        >
          <Plus aria-hidden="true" />
        </button>
      </div>
    );
  },
);
