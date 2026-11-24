"use client";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
} from "react";
import { cx } from "../../utils/cx";
import { mergeRefs } from "../../utils/merge-refs";
import type { ToggleGroupSize } from "./variants.gen";

interface ToggleGroupBaseProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange"
> {
  size?: ToggleGroupSize;
  disabled?: boolean;
}

export interface ToggleGroupSingleProps extends ToggleGroupBaseProps {
  /** One value at a time (a radio group). The default. */
  type?: "single";
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
}

export interface ToggleGroupMultipleProps extends ToggleGroupBaseProps {
  /** Any number of values (toggle buttons with aria-pressed). */
  type: "multiple";
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type ToggleGroupProps =
  ToggleGroupSingleProps | ToggleGroupMultipleProps;

interface GroupContext {
  type: "single" | "multiple";
  selected: (value: string) => boolean;
  toggle: (value: string) => void;
  tabbable: string | null;
  setFocused: (value: string) => void;
  disabled: boolean;
}

const ToggleGroupContext = createContext<GroupContext | null>(null);

const ITEM = ".cherry-toggle-group__item";

/**
 * Segmented control. `type="single"` is a radiogroup whose selected pill
 * slides between items; `type="multiple"` is a group of pressed buttons.
 * Arrow keys, Home and End move between items.
 */
export const ToggleGroup = forwardRef<HTMLDivElement, ToggleGroupProps>(
  function ToggleGroup(props, ref) {
    const {
      type = "single",
      value: valueProp,
      defaultValue,
      onValueChange,
      size = "md",
      disabled = false,
      className,
      children,
      ...rest
    } = props;
    const single = type === "single";
    const [inner, setInner] = useState<string | null | string[]>(
      defaultValue ?? (single ? null : []),
    );
    const value = valueProp !== undefined ? valueProp : inner;
    const list: string[] = Array.isArray(value) ? value : value ? [value] : [];

    const rootRef = useRef<HTMLDivElement>(null);
    const indicatorRef = useRef<HTMLSpanElement>(null);
    const [focused, setFocused] = useState<string | null>(null);
    const [first, setFirst] = useState<string | null>(null);
    const [ready, setReady] = useState(false);

    const items = () =>
      Array.from(
        rootRef.current?.querySelectorAll<HTMLButtonElement>(ITEM) ?? [],
      );

    useLayoutEffect(() => {
      const firstItem = items().find((b) => !b.disabled);
      setFirst(firstItem?.dataset.value ?? null);
    });

    const selected = useCallback((v: string) => list.includes(v), [list]);

    const set = (next: string | string[]) => {
      if (valueProp === undefined) setInner(next);
      (onValueChange as ((v: string | string[]) => void) | undefined)?.(next);
    };
    const toggle = (v: string) => {
      if (single) {
        if (!list.includes(v)) set(v);
      } else {
        set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
      }
    };

    const tabbable =
      focused && items().some((b) => b.dataset.value === focused)
        ? focused
        : (list[0] ?? first);

    // Sliding pill (single): measured from the selected item.
    const selectedKey = single ? (list[0] ?? "") : "";
    useLayoutEffect(() => {
      if (!single) return;
      const root = rootRef.current;
      const indicator = indicatorRef.current;
      if (!root || !indicator) return;
      const place = () => {
        const el = items().find((b) => b.dataset.value === selectedKey);
        if (!el) {
          indicator.style.setProperty("--_w", "0");
          return;
        }
        indicator.style.setProperty("--_x", `${el.offsetLeft}px`);
        indicator.style.setProperty("--_w", `${el.offsetWidth}`);
      };
      place();
      const observer =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(place);
      observer?.observe(root);
      return () => observer?.disconnect();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [single, selectedKey]);
    // Enable the slide only after the first placement (no slide on load).
    useLayoutEffect(() => {
      if (ready) return;
      const frame = requestAnimationFrame(() => setReady(true));
      return () => cancelAnimationFrame(frame);
    }, [ready]);

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      const enabled = items().filter((b) => !b.disabled);
      const index = enabled.findIndex((b) => b === document.activeElement);
      if (index === -1) return;
      let next: HTMLButtonElement | undefined;
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          next = enabled[(index + 1) % enabled.length];
          break;
        case "ArrowLeft":
        case "ArrowUp":
          next = enabled[(index - 1 + enabled.length) % enabled.length];
          break;
        case "Home":
          next = enabled[0];
          break;
        case "End":
          next = enabled[enabled.length - 1];
          break;
        default:
          return;
      }
      event.preventDefault();
      if (!next) return;
      const v = next.dataset.value ?? "";
      next.focus();
      setFocused(v);
      if (single) toggle(v);
    };

    return (
      <ToggleGroupContext.Provider
        value={{
          type,
          selected,
          toggle,
          tabbable,
          setFocused,
          disabled,
        }}
      >
        <div
          ref={mergeRefs(ref, rootRef)}
          role={single ? "radiogroup" : "group"}
          aria-disabled={disabled || undefined}
          className={cx("cherry-toggle-group", className)}
          data-type={type}
          data-size={size}
          data-ready={ready || undefined}
          onKeyDown={onKeyDown}
          {...rest}
        >
          {single ? (
            <span
              ref={indicatorRef}
              className="cherry-toggle-group__indicator"
              aria-hidden="true"
            />
          ) : null}
          {children}
        </div>
      </ToggleGroupContext.Provider>
    );
  },
);

export interface ToggleGroupItemProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "value"
> {
  value: string;
}

/** One option of a ToggleGroup. Icon-only items need an aria-label. */
export const ToggleGroupItem = forwardRef<
  HTMLButtonElement,
  ToggleGroupItemProps
>(function ToggleGroupItem(
  { value, disabled, className, onClick, onFocus, children, ...rest },
  ref,
) {
  const group = useContext(ToggleGroupContext);
  if (!group) throw new Error("ToggleGroupItem must be inside a ToggleGroup");
  const on = group.selected(value);
  const single = group.type === "single";
  const isDisabled = disabled || group.disabled;
  return (
    <button
      ref={ref}
      type="button"
      role={single ? "radio" : undefined}
      aria-checked={single ? on : undefined}
      aria-pressed={single ? undefined : on}
      tabIndex={group.tabbable === value ? 0 : -1}
      disabled={isDisabled}
      data-value={value}
      className={cx("cherry-toggle-group__item", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) group.toggle(value);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        group.setFocused(value);
      }}
      {...rest}
    >
      {children}
    </button>
  );
});
