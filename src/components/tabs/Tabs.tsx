"use client";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { cx } from "../../utils/cx";
import { assignRef } from "../../utils/merge-refs";
import type { TabsVariant } from "./variants.gen";

interface TabsContextValue {
  value: string | undefined;
  select: (value: string) => void;
  baseId: string;
  variant: TabsVariant;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(part: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error(`<${part}> must be used inside <Tabs>`);
  return ctx;
}

const idFor = (baseId: string, kind: "tab" | "panel", value: string) =>
  `${baseId}-${kind}-${value.replace(/\s+/g, "-")}`;

/** Assigns a node to a forwarded ref of either shape. */
export interface TabsProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  /** Selected tab (controlled). Pair with `onValueChange`. */
  value?: string;
  /**
   * Initially selected tab (uncontrolled). Defaults to the first enabled tab
   * after mount; set it to have the selection in server-rendered HTML.
   */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** `pill` (raised tab in a muted track, default) or `underline`. */
  variant?: TabsVariant;
}

/**
 * Tabs: a `TabList` of `Tab`s plus one `TabPanel` per tab, matched by
 * `value`. Arrow keys move and select (automatic activation), Home/End jump
 * to the ends; the indicator slides to the selected tab.
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    value: controlled,
    defaultValue,
    onValueChange,
    variant = "pill",
    className,
    children,
    ...rest
  },
  ref,
) {
  const [internal, setInternal] = useState(defaultValue);
  const value = controlled ?? internal;
  const baseId = useId();
  const root = useRef<HTMLDivElement | null>(null);

  // No value given: select the first enabled tab once mounted. Pass
  // `defaultValue` to have the selection in the server-rendered HTML.
  useLayoutEffect(() => {
    if (value !== undefined || !root.current) return;
    const first = root.current.querySelector<HTMLElement>(
      '[role="tab"]:not(:disabled)',
    );
    if (first?.dataset.value !== undefined) setInternal(first.dataset.value);
  }, [value]);
  const select = useCallback(
    (next: string) => {
      if (controlled === undefined) setInternal(next);
      onValueChange?.(next);
    },
    [controlled, onValueChange],
  );
  return (
    <TabsContext.Provider value={{ value, select, baseId, variant }}>
      <div
        ref={(node) => {
          root.current = node;
          assignRef(ref, node);
        }}
        className={cx("cherry-tabs", className)}
        data-variant={variant}
        {...rest}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
});

export interface TabListProps extends HTMLAttributes<HTMLDivElement> {
  /** Name the tab list (or use aria-labelledby). */
  "aria-label"?: string;
}

const TABS = '[role="tab"]';

export const TabList = forwardRef<HTMLDivElement, TabListProps>(
  function TabList({ className, children, onKeyDown, ...rest }, ref) {
    const { value, select, variant } = useTabs("TabList");
    const list = useRef<HTMLDivElement | null>(null);

    // Slide the indicator: measure the selected tab and hand its offset and
    // width to CSS. The first measure places it without a transition
    // (data-indicator="static"); later moves animate ("ready").
    useLayoutEffect(() => {
      const el = list.current;
      if (!el) return;
      let frame = 0;
      const measure = () => {
        const tabs = el.querySelectorAll<HTMLElement>(TABS);
        const active =
          Array.from(tabs).find(
            (t) => t.getAttribute("aria-selected") === "true",
          ) ?? null;
        if (!active) {
          el.removeAttribute("data-indicator");
          return;
        }
        // Sub-pixel geometry: offsetLeft/offsetWidth round to whole pixels,
        // which leaves the pill up to a pixel off its tab at either end.
        const listBox = el.getBoundingClientRect();
        const tabBox = active.getBoundingClientRect();
        const x = tabBox.left - listBox.left - el.clientLeft + el.scrollLeft;
        el.style.setProperty("--_indicator-x", `${x}px`);
        el.style.setProperty("--_indicator-w", `${tabBox.width}px`);
        if (el.getAttribute("data-indicator") !== "ready") {
          if (!el.hasAttribute("data-indicator"))
            el.setAttribute("data-indicator", "static");
          // Arm the slide only after the first placement has painted.
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => {
            if (el.hasAttribute("data-indicator"))
              el.setAttribute("data-indicator", "ready");
          });
        }
      };
      measure();
      const observer =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(measure);
      observer?.observe(el);
      el.querySelectorAll(TABS).forEach((t) => observer?.observe(t));
      return () => {
        cancelAnimationFrame(frame);
        observer?.disconnect();
      };
    }, [value, variant, children]);

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || !list.current) return;
      const tabs = Array.from(
        list.current.querySelectorAll<HTMLButtonElement>(TABS),
      ).filter((t) => !t.disabled);
      if (!tabs.length) return;
      const current = tabs.findIndex((t) => t === document.activeElement);
      let next: number;
      switch (event.key) {
        case "ArrowRight":
          next = (current + 1) % tabs.length;
          break;
        case "ArrowLeft":
          next = (current - 1 + tabs.length) % tabs.length;
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = tabs.length - 1;
          break;
        default:
          return;
      }
      event.preventDefault();
      const tab = tabs[next];
      if (!tab) return;
      tab.focus();
      const tabValue = tab.dataset.value;
      if (tabValue !== undefined) select(tabValue);
    };

    return (
      <div
        ref={(node) => {
          list.current = node;
          assignRef(ref, node);
        }}
        role="tablist"
        aria-orientation="horizontal"
        className={cx("cherry-tabs__list", className)}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        <span className="cherry-tabs__indicator" aria-hidden="true" />
        {children}
      </div>
    );
  },
);

export interface TabProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "value"
> {
  /** Matches the `value` of its TabPanel. */
  value: string;
  /** Optional leading icon. */
  icon?: ReactNode;
}

export const Tab = forwardRef<HTMLButtonElement, TabProps>(function Tab(
  { value, icon, className, children, onClick, ...rest },
  ref,
) {
  const ctx = useTabs("Tab");
  const selected = ctx.value === value;

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={idFor(ctx.baseId, "tab", value)}
      aria-selected={selected}
      aria-controls={idFor(ctx.baseId, "panel", value)}
      tabIndex={selected ? 0 : -1}
      data-value={value}
      className={cx("cherry-tabs__tab", className)}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) ctx.select(value);
      }}
      {...rest}
    >
      {icon ? (
        <span className="cherry-tabs__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
});

export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

/** Content for one tab. Inactive panels stay mounted but hidden. */
export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  function TabPanel({ value, className, children, ...rest }, ref) {
    const ctx = useTabs("TabPanel");
    const selected = ctx.value === value;
    return (
      <div
        ref={ref}
        role="tabpanel"
        id={idFor(ctx.baseId, "panel", value)}
        aria-labelledby={idFor(ctx.baseId, "tab", value)}
        tabIndex={0}
        hidden={!selected}
        className={cx("cherry-tabs__panel", className)}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
