import {
  forwardRef,
  useId,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cx } from "../../utils/cx";
import type { ProgressSize, ProgressVariant } from "./variants.gen";

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  /** Current value. Omit (or pass null) for an indeterminate bar. */
  value?: number | null;
  /** Defaults to 100. */
  max?: number;
  /** Visible label; also names the progressbar. */
  label?: ReactNode;
  /** Shows the percentage next to the label. */
  showValue?: boolean;
  /** Formats the shown value. Defaults to a rounded percentage. */
  formatValue?: (value: number, max: number) => string;
  /** Bar color. Defaults to `default`. */
  variant?: ProgressVariant;
  /** Bar thickness: 4px (`sm`) or 6px (`md`, default). */
  size?: ProgressSize;
  /** Accessible name when there is no visible label. */
  "aria-label"?: string;
}

const percent = (value: number, max: number) =>
  `${Math.round((value / max) * 100)}%`;

/**
 * Linear progress bar (role="progressbar"). The fill eases to each new
 * value; without a value it slides as an indeterminate loader.
 * No client JS: safe in Server Components.
 */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  function Progress(
    {
      value,
      max = 100,
      label,
      showValue,
      formatValue = percent,
      variant = "default",
      size = "md",
      className,
      style,
      "aria-label": ariaLabel,
      ...rest
    },
    ref,
  ) {
    const labelId = useId();
    const safeMax = max > 0 ? max : 100;
    const indeterminate = value === undefined || value === null;
    const clamped = indeterminate ? 0 : Math.min(Math.max(value, 0), safeMax);
    const shown = indeterminate ? null : formatValue(clamped, safeMax);

    return (
      <div
        ref={ref}
        className={cx("cherry-progress", className)}
        data-variant={variant}
        data-size={size}
        data-indeterminate={indeterminate || undefined}
        style={
          {
            ...style,
            "--_value": indeterminate ? undefined : clamped / safeMax,
          } as CSSProperties
        }
        {...rest}
      >
        {label || (showValue && shown) ? (
          <div className="cherry-progress__header">
            {label ? (
              <span id={labelId} className="cherry-progress__label">
                {label}
              </span>
            ) : null}
            {showValue && shown ? (
              <span className="cherry-progress__value" aria-hidden="true">
                {shown}
              </span>
            ) : null}
          </div>
        ) : null}
        <div
          role="progressbar"
          className="cherry-progress__track"
          aria-labelledby={label && !ariaLabel ? labelId : undefined}
          aria-label={ariaLabel}
          aria-valuemin={0}
          aria-valuemax={safeMax}
          aria-valuenow={indeterminate ? undefined : clamped}
          aria-valuetext={shown ?? undefined}
          aria-busy={indeterminate || undefined}
        >
          <span className="cherry-progress__fill" />
        </div>
      </div>
    );
  },
);
