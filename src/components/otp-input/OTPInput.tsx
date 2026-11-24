"use client";
import {
  Fragment,
  forwardRef,
  useRef,
  useState,
  type ClipboardEvent,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from "react";
import { cx } from "../../utils/cx";
import { useFieldControl, useFieldGroupLabel } from "../field/field-context";
import type { OtpInputSize } from "./variants.gen";

export interface OTPSlotProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type"
> {
  /** The slot's character ("" when empty). */
  value: string;
}

/**
 * One character cell of an <OTPInput>: a single-character input with a
 * blinking caret while it is focused and empty. Exported for custom layouts;
 * <OTPInput> renders these for you.
 */
export const OTPSlot = forwardRef<HTMLInputElement, OTPSlotProps>(
  function OTPSlot({ value, className, ...rest }, ref) {
    return (
      <span
        className="cherry-otp-input__slot"
        data-filled={value ? "" : undefined}
      >
        <input
          ref={ref}
          type="text"
          className={cx("cherry-otp-input__char", className)}
          value={value}
          {...rest}
        />
        <span className="cherry-otp-input__caret" aria-hidden="true" />
      </span>
    );
  },
);

export interface OTPInputProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  /** Number of slots. Defaults to 6. */
  length?: number;
  /** Controlled value. */
  value?: string;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Called once every slot is filled. */
  onComplete?: (value: string) => void;
  /** Accepted characters. Defaults to "numeric". */
  mode?: "numeric" | "alphanumeric";
  /** Show a divider between the two halves. */
  separator?: boolean;
  size?: OtpInputSize;
  /** Error state; set automatically inside a <Field error>. */
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  /** Form field name (the joined code is submitted). */
  name?: string;
  autoFocus?: boolean;
  /** Accessible name per slot. Defaults to "Character {n} of {length}". */
  slotLabel?: (index: number, length: number) => string;
}

const PATTERNS = {
  numeric: /[0-9]/,
  alphanumeric: /[0-9a-zA-Z]/,
} as const;

const defaultSlotLabel = (index: number, length: number) =>
  `Character ${index + 1} of ${length}`;

/**
 * One-time code input: N single-character slots. Typing advances, Backspace
 * goes back, arrows move, and pasting (or SMS autofill) fills every slot.
 */
export const OTPInput = forwardRef<HTMLDivElement, OTPInputProps>(
  function OTPInput(
    {
      length = 6,
      value,
      defaultValue = "",
      onValueChange,
      onComplete,
      mode = "numeric",
      separator = false,
      size = "md",
      invalid,
      disabled,
      required,
      name,
      autoFocus,
      slotLabel = defaultSlotLabel,
      className,
      ...rest
    },
    ref,
  ) {
    const [uncontrolled, setUncontrolled] = useState(defaultValue);
    const code = (value ?? uncontrolled).slice(0, length);
    const inputs = useRef<Array<HTMLInputElement | null>>([]);
    // The latest code, ahead of the re-render, for focus decisions made in
    // the same event that changed it.
    const latest = useRef(code);
    latest.current = code;
    const pattern = PATTERNS[mode];

    const control = useFieldControl({
      ...rest,
      "aria-invalid": invalid ? true : rest["aria-invalid"],
      disabled,
      required,
    });
    const {
      id,
      disabled: isDisabled,
      required: isRequired,
      "aria-describedby": describedBy,
      "aria-invalid": ariaInvalid,
      ...groupAttrs
    } = control;
    const isInvalid = ariaInvalid === true || ariaInvalid === "true";

    const chars = Array.from({ length }, (_, i) => code[i] ?? "");

    const focusSlot = (index: number) => {
      const el = inputs.current[Math.max(0, Math.min(length - 1, index))];
      el?.focus();
      el?.select();
    };

    const update = (next: string[]) => {
      // Keep the code contiguous: no holes before the last character.
      const joined = next.join("").slice(0, length);
      if (joined === code) return;
      latest.current = joined;
      if (value === undefined) setUncontrolled(joined);
      onValueChange?.(joined);
      if (joined.length === length) onComplete?.(joined);
    };

    /** Writes characters starting at `index`, then focuses after them. */
    const fill = (index: number, text: string) => {
      const accepted = Array.from(text).filter((c) => pattern.test(c));
      if (!accepted.length) return;
      const start = Math.min(index, code.length);
      const next = chars.slice();
      accepted.slice(0, length - start).forEach((c, i) => {
        next[start + i] = c;
      });
      update(next);
      focusSlot(Math.min(start + accepted.length, length - 1));
    };

    const onKeyDown = (
      index: number,
      event: KeyboardEvent<HTMLInputElement>,
    ) => {
      const { key } = event;
      if (key === "Backspace") {
        event.preventDefault();
        const next = chars.slice();
        if (chars[index]) {
          next.splice(index, 1);
          update(next);
        } else if (index > 0) {
          next.splice(index - 1, 1);
          update(next);
          focusSlot(index - 1);
        }
      } else if (key === "Delete") {
        event.preventDefault();
        const next = chars.slice();
        next.splice(index, 1);
        update(next);
      } else if (key === "ArrowLeft") {
        event.preventDefault();
        focusSlot(index - 1);
      } else if (key === "ArrowRight") {
        event.preventDefault();
        focusSlot(Math.min(index + 1, code.length));
      } else if (key === "Home") {
        event.preventDefault();
        focusSlot(0);
      } else if (key === "End") {
        event.preventDefault();
        focusSlot(Math.min(code.length, length - 1));
      } else if (
        key.length === 1 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        // Printable keys are handled here so typing over a filled slot
        // replaces it; IME and virtual keyboards fall through to onChange.
        event.preventDefault();
        if (!pattern.test(key)) return;
        const start = Math.min(index, code.length);
        const next = chars.slice();
        next[start] = key;
        update(next);
        focusSlot(start + 1);
      }
    };

    const onPaste = (
      index: number,
      event: ClipboardEvent<HTMLInputElement>,
    ) => {
      event.preventDefault();
      fill(index, event.clipboardData.getData("text"));
    };

    const half = Math.ceil(length / 2);

    const groupLabel = useFieldGroupLabel(rest);

    return (
      <div
        ref={ref}
        role="group"
        className={cx("cherry-otp-input", className)}
        data-size={size}
        data-invalid={isInvalid || undefined}
        data-disabled={isDisabled || undefined}
        data-separator={separator || undefined}
        {...groupAttrs}
        aria-labelledby={groupLabel}
      >
        {chars.map((char, i) => (
          <Fragment key={i}>
            {separator && i === half ? (
              <span
                className="cherry-otp-input__separator"
                aria-hidden="true"
              />
            ) : null}
            <OTPSlot
              ref={(el) => {
                inputs.current[i] = el;
              }}
              id={i === 0 ? id : undefined}
              value={char}
              inputMode={mode === "numeric" ? "numeric" : "text"}
              autoComplete={i === 0 ? "one-time-code" : "off"}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              autoFocus={autoFocus && i === 0}
              disabled={isDisabled}
              required={isRequired && i === 0}
              aria-label={slotLabel(i, length)}
              aria-describedby={describedBy}
              aria-invalid={isInvalid || undefined}
              // Only the next empty slot (or a filled one) is reachable by Tab.
              tabIndex={i === Math.min(code.length, length - 1) ? 0 : -1}
              onFocus={(event) => {
                // Jump to the first empty slot: no holes in the code.
                const filled = latest.current.length;
                if (i > filled) focusSlot(filled);
                else event.currentTarget.select();
              }}
              onKeyDown={(event) => onKeyDown(i, event)}
              onPaste={(event) => onPaste(i, event)}
              onChange={(event) => {
                const text = event.target.value;
                if (text === "") {
                  const next = chars.slice();
                  next.splice(i, 1);
                  update(next);
                } else if (text !== char) {
                  // Autofill or IME: may bring the whole code at once.
                  fill(i, text.startsWith(char) && char ? text.slice(1) : text);
                }
              }}
            />
          </Fragment>
        ))}
        {name ? <input type="hidden" name={name} value={code} /> : null}
      </div>
    );
  },
);
