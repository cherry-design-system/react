import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cx } from "../../utils/cx";
import type { StepperOrientation, StepperState } from "./variants.gen";

export interface StepperStep {
  label: ReactNode;
  description?: ReactNode;
  /** Overrides the state derived from `current`. */
  state?: StepperState;
}

export interface StepperProps extends HTMLAttributes<HTMLOListElement> {
  steps: StepperStep[];
  /** Index (0-based) of the current step; earlier steps are complete. */
  current: number;
  /** Defaults to `horizontal`. */
  orientation?: StepperOrientation;
  /** Screen-reader words for each state (translate here). */
  labels?: Partial<Record<StepperState, string>>;
}

const DEFAULT_LABELS: Record<StepperState, string> = {
  complete: "Completed",
  current: "Current step",
  upcoming: "Not started",
};

/**
 * Progress through a multi-step flow, as an ordered list. The current step
 * has aria-current="step"; each step also announces its state. Connectors
 * fill as steps complete. No client JS: safe in Server Components.
 */
export const Stepper = forwardRef<HTMLOListElement, StepperProps>(
  function Stepper(
    {
      steps,
      current,
      orientation = "horizontal",
      labels: labelOverrides,
      className,
      ...rest
    },
    ref,
  ) {
    const labels = { ...DEFAULT_LABELS, ...labelOverrides };
    return (
      <ol
        ref={ref}
        className={cx("cherry-stepper", className)}
        data-orientation={orientation}
        {...rest}
      >
        {steps.map((step, i) => {
          const state: StepperState =
            step.state ??
            (i < current ? "complete" : i === current ? "current" : "upcoming");
          const last = i === steps.length - 1;
          return (
            <li
              key={i}
              className="cherry-stepper__step"
              data-state={state}
              aria-current={state === "current" ? "step" : undefined}
            >
              <span className="cherry-stepper__marker" aria-hidden="true">
                {state === "complete" ? (
                  <Check className="cherry-stepper__check" />
                ) : (
                  <span className="cherry-stepper__number">{i + 1}</span>
                )}
              </span>
              {last ? null : (
                <span
                  className="cherry-stepper__connector"
                  aria-hidden="true"
                />
              )}
              <span className="cherry-stepper__text">
                <span className="cherry-stepper__label">{step.label}</span>
                {step.description ? (
                  <span className="cherry-stepper__description">
                    {step.description}
                  </span>
                ) : null}
                <span className="cherry-sr-only">{labels[state]}</span>
              </span>
            </li>
          );
        })}
      </ol>
    );
  },
);
