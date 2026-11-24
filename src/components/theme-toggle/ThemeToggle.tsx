"use client";
import { forwardRef, useRef, type HTMLAttributes, type KeyboardEvent } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cx } from "../../utils/cx";
import { useColorMode } from "../../theme/use-color-mode";
import type { ColorModePreference } from "../../theme/color-mode";
import type { ThemeToggleSize } from "./variants.gen";

export interface ThemeToggleProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  size?: ThemeToggleSize;
  /** Labels for the three options (translate here). */
  labels?: Partial<Record<ColorModePreference, string>>;
  /** Group label. Defaults to "Color mode". */
  "aria-label"?: string;
}

const OPTIONS = [
  { value: "system", Icon: Monitor, label: "System" },
  { value: "light", Icon: Sun, label: "Light" },
  { value: "dark", Icon: Moon, label: "Dark" },
] as const;

/** System / Light / Dark segmented switch (a radio group, arrow keys move). */
export const ThemeToggle = forwardRef<HTMLDivElement, ThemeToggleProps>(function ThemeToggle(
  { size = "md", labels, className, "aria-label": ariaLabel = "Color mode", ...rest },
  ref,
) {
  const { preference, setPreference } = useColorMode();
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const current = OPTIONS.findIndex((o) => o.value === preference);
    const next = (current + step + OPTIONS.length) % OPTIONS.length;
    const option = OPTIONS[next];
    if (!option) return;
    setPreference(option.value);
    buttons.current[next]?.focus();
  };

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={ariaLabel}
      className={cx("cherry-theme-toggle", className)}
      data-size={size}
      data-value={preference}
      onKeyDown={onKeyDown}
      {...rest}
    >
      <span className="cherry-theme-toggle__indicator" aria-hidden="true" />
      {OPTIONS.map(({ value, Icon, label }, i) => {
        const checked = preference === value;
        const name = labels?.[value] ?? label;
        return (
          <button
            key={value}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={name}
            title={name}
            tabIndex={checked ? 0 : -1}
            className="cherry-theme-toggle__option"
            onClick={() => setPreference(value)}
          >
            <Icon aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
});
