"use client";
import {
  forwardRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type InputHTMLAttributes,
} from "react";
import { cx } from "../../utils/cx";
import { useFieldControl } from "../field/field-context";
import type { RangeSize } from "./variants.gen";

export interface RangeProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type"
> {
  size?: RangeSize;
  /** Error state; set automatically inside a <Field error>. */
  invalid?: boolean;
  /** Stretch to the container width (default). */
  fullWidth?: boolean;
  /** Class for the outer wrapper (className goes to the <input>). */
  wrapperClassName?: string;
}

const toNumber = (v: unknown, fallback: number) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Slider on a native <input type="range">: keyboard, touch, forms and
 * assistive tech come from the platform. The filled part of the track
 * follows the value through the --_ratio custom property (0 to 1).
 */
export const Range = forwardRef<HTMLInputElement, RangeProps>(function Range(
  {
    size = "md",
    invalid,
    fullWidth = true,
    wrapperClassName,
    className,
    style,
    onChange,
    ...props
  },
  ref,
) {
  const min = toNumber(props.min, 0);
  const max = toNumber(props.max, 100);
  // Uncontrolled ranges start at the browser default: the midpoint.
  const [uncontrolled, setUncontrolled] = useState(() =>
    toNumber(props.defaultValue, min + (max - min) / 2),
  );
  const current =
    props.value !== undefined ? toNumber(props.value, min) : uncontrolled;
  const ratio =
    max > min ? Math.min(1, Math.max(0, (current - min) / (max - min))) : 0;

  const control = useFieldControl({
    ...props,
    "aria-invalid": invalid ? true : props["aria-invalid"],
  });
  const isInvalid =
    control["aria-invalid"] === true || control["aria-invalid"] === "true";

  return (
    <div
      className={cx("cherry-range", wrapperClassName)}
      data-size={size}
      data-invalid={isInvalid || undefined}
      data-disabled={control.disabled || undefined}
      data-full-width={fullWidth || undefined}
      style={{ ...style, "--_ratio": ratio } as CSSProperties}
    >
      <input
        ref={ref}
        type="range"
        className={cx("cherry-range__input", className)}
        {...control}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          setUncontrolled(Number(event.target.value));
          onChange?.(event);
        }}
      />
    </div>
  );
});
