"use client";
import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { cx } from "../../utils/cx";
import { assignRef } from "../../utils/merge-refs";
import { useFieldControl } from "../field/field-context";
import type { CheckboxSize } from "./variants.gen";

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type"
> {
  /** Visible label. Omit only when an aria-label is given. */
  label?: ReactNode;
  /** 16 / 18 / 20 px box. Defaults to "md". */
  size?: CheckboxSize;
  /** Error state; set automatically inside a <Field error>. */
  invalid?: boolean;
  /** Mixed state (a dash). Announced as "mixed"; cleared by the next click. */
  indeterminate?: boolean;
  /** Class for the outer <label> (className goes to the <input>). */
  wrapperClassName?: string;
}

const useIsoLayoutEffect =
  typeof window === "undefined" ? () => {} : useLayoutEffect;

/**
 * Checkbox on a native <input type="checkbox">: it submits, resets and
 * handles keyboard and assistive tech natively. The checkmark stroke draws
 * in; `indeterminate` shows a dash.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    {
      label,
      size = "md",
      invalid,
      indeterminate = false,
      wrapperClassName,
      className,
      style,
      ...props
    },
    ref,
  ) {
    const inner = useRef<HTMLInputElement | null>(null);
    const setRef = useCallback(
      (node: HTMLInputElement | null) => {
        inner.current = node;
        assignRef(ref, node);
      },
      [ref],
    );
    useIsoLayoutEffect(() => {
      if (inner.current) inner.current.indeterminate = indeterminate;
    });

    const control = useFieldControl({
      ...props,
      "aria-invalid": invalid ? true : props["aria-invalid"],
    });
    const isInvalid =
      control["aria-invalid"] === true || control["aria-invalid"] === "true";

    return (
      <label
        className={cx("cherry-checkbox", wrapperClassName)}
        data-size={size}
        data-invalid={isInvalid || undefined}
        data-disabled={control.disabled || undefined}
        style={style}
      >
        <span className="cherry-checkbox__control">
          <input
            ref={setRef}
            type="checkbox"
            className={cx("cherry-checkbox__input", className)}
            {...control}
          />
          <svg
            className="cherry-checkbox__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path
              className="cherry-checkbox__check"
              pathLength={1}
              d="M5 12.5l4.5 4.5L19 7.5"
            />
            <path
              className="cherry-checkbox__dash"
              pathLength={1}
              d="M6 12h12"
            />
          </svg>
        </span>
        {label ? <span className="cherry-checkbox__label">{label}</span> : null}
      </label>
    );
  },
);
