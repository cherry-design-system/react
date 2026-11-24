"use client";
import { useRef, useState, type KeyboardEvent } from "react";
import { Check } from "lucide-react";

export interface TimeOption {
  value: number;
  label: string;
  disabled?: boolean;
}

export interface TimeListboxProps {
  options: TimeOption[];
  value: number | null;
  onSelect: (value: number) => void;
  /** Accessible name of the listbox. */
  label: string;
  className?: string;
  /** Show a check on the selected option. */
  check?: boolean;
}

/**
 * Single-select listbox. Arrows, Home/End move focus; Enter, Space or a click
 * select. One option is tabbable (the selected one, else the first enabled).
 */
export function TimeListbox({
  options,
  value,
  onSelect,
  label,
  className,
  check = true,
}: TimeListboxProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const firstEnabled = options.find((o) => !o.disabled)?.value ?? null;
  const tabbable =
    focused !== null && options.some((o) => o.value === focused)
      ? focused
      : value !== null && options.some((o) => o.value === value)
        ? value
        : firstEnabled;

  const focusOption = (v: number) => {
    setFocused(v);
    listRef.current?.querySelector<HTMLElement>(`[data-value="${v}"]`)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const enabled = options.filter((o) => !o.disabled);
    const index = enabled.findIndex((o) => o.value === tabbable);
    let next: TimeOption | undefined;
    switch (event.key) {
      case "ArrowDown":
        next = enabled[Math.min(index + 1, enabled.length - 1)];
        break;
      case "ArrowUp":
        next = enabled[Math.max(index - 1, 0)];
        break;
      case "Home":
        next = enabled[0];
        break;
      case "End":
        next = enabled[enabled.length - 1];
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (tabbable !== null) onSelect(tabbable);
        return;
      default:
        return;
    }
    event.preventDefault();
    if (next) focusOption(next.value);
  };

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label={label}
      className={className}
      onKeyDown={onKeyDown}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <div
            key={option.value}
            role="option"
            aria-selected={selected}
            aria-disabled={option.disabled || undefined}
            tabIndex={option.value === tabbable ? 0 : -1}
            data-value={option.value}
            className="cherry-time-picker__option"
            onFocus={() => setFocused(option.value)}
            onClick={option.disabled ? undefined : () => onSelect(option.value)}
          >
            <span className="cherry-time-picker__option-label">
              {option.label}
            </span>
            {check ? (
              <Check className="cherry-time-picker__check" aria-hidden="true" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Centers the tabbable option in its listbox (the listbox scrolls, never the
 * page) and focuses it.
 */
export function focusListbox(
  listbox: HTMLElement | null | undefined,
  focus = true,
) {
  const option = listbox?.querySelector<HTMLElement>(
    '[role="option"][tabindex="0"]',
  );
  if (!listbox || !option) return;
  listbox.scrollTop =
    option.offsetTop - listbox.clientHeight / 2 + option.offsetHeight / 2;
  if (focus) option.focus({ preventScroll: true });
}
