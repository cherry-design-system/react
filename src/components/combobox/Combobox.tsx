"use client";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { cx } from "../../utils/cx";
import { assignRef } from "../../utils/merge-refs";
import { useFieldControl } from "../field/field-context";
import type { ComboboxSize } from "./variants.gen";

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "value" | "defaultValue" | "onChange" | "type" | "list"
> {
  /** The choices; plain strings are both value and label. */
  options: ReadonlyArray<ComboboxOption | string>;
  /** Controlled selected value (null = none). */
  value?: string | null;
  /** Initial value when uncontrolled. */
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** Called with the typed text on every keystroke. */
  onInputChange?: (text: string) => void;
  /** Custom matcher. Defaults to a case-insensitive "contains". */
  filter?: (option: ComboboxOption, query: string) => boolean;
  size?: ComboboxSize;
  /** Error state; set automatically inside a <Field error>. */
  invalid?: boolean;
  /** Shown when nothing matches. */
  emptyMessage?: ReactNode;
  /** Second line under emptyMessage. */
  emptyHint?: ReactNode;
  /** Live-region text for the match count (translate here). */
  resultsLabel?: (count: number) => string;
  /** Name of the chevron button. Defaults to "Show options". */
  toggleLabel?: string;
  /** Class for the outer wrapper (className goes to the <input>). */
  wrapperClassName?: string;
}

const useIsoLayoutEffect =
  typeof window === "undefined" ? () => {} : useLayoutEffect;

const defaultFilter = (option: ComboboxOption, query: string) =>
  option.label.toLowerCase().includes(query.trim().toLowerCase());

const defaultResultsLabel = (count: number) =>
  count === 1 ? "1 result" : `${count} results`;

const supportsAnchor = () =>
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("anchor-name: --a");

type PopoverElement = HTMLDivElement & {
  showPopover?: () => void;
  hidePopover?: () => void;
};

function isPopoverOpen(el: HTMLElement) {
  try {
    return el.matches(":popover-open");
  } catch {
    return false;
  }
}

/**
 * Text input with a filterable listbox (ARIA combobox pattern). The list is
 * a native `popover`, placed with CSS anchor positioning; it scales and fades
 * in and out. Arrow keys move, Enter selects, Escape closes.
 */
export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(
  function Combobox(
    {
      options: rawOptions,
      value,
      defaultValue = null,
      onValueChange,
      onInputChange,
      filter = defaultFilter,
      size = "md",
      invalid,
      emptyMessage = "No results found",
      emptyHint,
      resultsLabel = defaultResultsLabel,
      toggleLabel = "Show options",
      wrapperClassName,
      className,
      name,
      onKeyDown,
      onBlur,
      onFocus,
      ...props
    },
    ref,
  ) {
    const options = useMemo<ComboboxOption[]>(
      () =>
        rawOptions.map((o) =>
          typeof o === "string" ? { value: o, label: o } : o,
        ),
      [rawOptions],
    );
    const [uncontrolled, setUncontrolled] = useState(defaultValue);
    const selected = value !== undefined ? value : uncontrolled;
    const selectedLabel =
      options.find((o) => o.value === selected)?.label ?? "";

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState<string | null>(null);
    const [text, setText] = useState(selectedLabel);
    const [active, setActive] = useState(-1);

    const baseId = useId();
    const listId = `${baseId}-listbox`;
    const anchor = `--cherry-combobox-${baseId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const optionId = (i: number) => `${baseId}-option-${i}`;

    const wrapper = useRef<HTMLDivElement | null>(null);
    const input = useRef<HTMLInputElement | null>(null);
    const popover = useRef<PopoverElement | null>(null);
    const setInputRef = useCallback(
      (node: HTMLInputElement | null) => {
        input.current = node;
        assignRef(ref, node);
      },
      [ref],
    );

    const filtered = useMemo(
      () => (query ? options.filter((o) => filter(o, query)) : options),
      [options, query, filter],
    );
    // While the list animates out, keep showing what was on screen instead
    // of snapping back to the unfiltered options.
    const lastShown = useRef(filtered);
    if (open) lastShown.current = filtered;
    const shown = open ? filtered : lastShown.current;

    // Outside of typing, the field shows the selected option's label.
    useEffect(() => {
      if (!open) setText(selectedLabel);
    }, [selectedLabel, open]);

    const firstEnabled = (from: number, dir: 1 | -1) => {
      const n = filtered.length;
      for (let k = 0; k < n; k++) {
        const i = (from + dir * k + n * 2) % n;
        if (!filtered[i]?.disabled) return i;
      }
      return -1;
    };

    // Opening without typing lists everything, the selection highlighted.
    const openList = () => {
      setOpen(true);
      setQuery(null);
      setActive(options.findIndex((o) => o.value === selected));
    };

    const close = (revert = true) => {
      setOpen(false);
      setQuery(null);
      setActive(-1);
      if (revert) setText(selectedLabel);
    };

    const commit = (next: ComboboxOption | null) => {
      const nextValue = next?.value ?? null;
      if (nextValue !== selected) {
        if (value === undefined) setUncontrolled(nextValue);
        onValueChange?.(nextValue);
      }
      setText(next?.label ?? "");
      close(false);
    };

    // Show / hide the native popover, and place it where anchor
    // positioning is missing.
    useIsoLayoutEffect(() => {
      const el = popover.current;
      if (!el || typeof el.showPopover !== "function") return;
      if (open && !isPopoverOpen(el)) {
        if (!supportsAnchor() && wrapper.current) {
          const r = wrapper.current.getBoundingClientRect();
          el.style.top = `${r.bottom}px`;
          el.style.left = `${r.left}px`;
          el.style.width = `${r.width}px`;
        }
        el.showPopover();
      } else if (!open && isPopoverOpen(el)) {
        el.hidePopover?.();
      }
    }, [open]);

    // Keep the highlighted option in view.
    useEffect(() => {
      if (!open || active < 0) return;
      const el = document.getElementById(optionId(active));
      if (el && typeof el.scrollIntoView === "function")
        el.scrollIntoView({ block: "nearest" });
    }, [open, active]);

    const control = useFieldControl({
      ...props,
      "aria-invalid": invalid ? true : props["aria-invalid"],
    });
    const isInvalid =
      control["aria-invalid"] === true || control["aria-invalid"] === "true";
    const disabled = Boolean(control.disabled);
    const readOnly = Boolean(props.readOnly);

    const move = (dir: 1 | -1) => {
      if (!filtered.length) return;
      const start =
        active < 0 ? (dir === 1 ? 0 : filtered.length - 1) : active + dir;
      setActive(firstEnabled(start, dir));
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || disabled || readOnly) return;
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          if (!open) openList();
          else move(1);
          return;
        case "ArrowUp":
          event.preventDefault();
          if (!open) openList();
          else move(-1);
          return;
        case "Enter": {
          if (!open) return;
          event.preventDefault();
          const option = filtered[active];
          if (option && !option.disabled) commit(option);
          return;
        }
        case "Escape":
          if (open) {
            event.preventDefault();
            close();
          } else if (text) {
            event.preventDefault();
            commit(null);
          }
          return;
        case "Tab":
          if (open) close();
          return;
      }
    };

    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
      onBlur?.(event);
      const next = event.relatedTarget as Node | null;
      if (next && wrapper.current?.contains(next)) return;
      if (open || text !== selectedLabel) {
        if (text.trim() === "" && selected !== null) commit(null);
        else close();
      }
    };

    return (
      <div
        ref={wrapper}
        className={cx("cherry-combobox", wrapperClassName)}
        data-size={size}
        data-open={open || undefined}
        data-invalid={isInvalid || undefined}
        data-disabled={disabled || undefined}
        style={{ "--_anchor": anchor } as CSSProperties}
      >
        <input
          ref={setInputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && active >= 0 && filtered[active]
              ? optionId(active)
              : undefined
          }
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={cx("cherry-combobox__input", className)}
          {...control}
          value={text}
          onChange={(event) => {
            const next = event.target.value;
            setText(next);
            setQuery(next);
            onInputChange?.(next);
            setOpen(true);
            const matches = next
              ? options.filter((o) => filter(o, next))
              : options;
            setActive(matches.findIndex((o) => !o.disabled));
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={onFocus}
          onClick={() => {
            if (!open && !disabled && !readOnly) openList();
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          className="cherry-combobox__trigger"
          aria-label={toggleLabel}
          aria-controls={listId}
          aria-expanded={open}
          disabled={disabled || readOnly}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            input.current?.focus();
            if (open) close();
            else openList();
          }}
        >
          <ChevronDown aria-hidden="true" />
        </button>
        <div
          ref={popover}
          popover="manual"
          className="cherry-combobox__popover"
          data-open={open || undefined}
          onMouseDown={(event) => event.preventDefault()}
        >
          <div
            id={listId}
            role="listbox"
            className="cherry-combobox__listbox"
            hidden={shown.length === 0}
          >
            {shown.map((option, i) => {
              const isSelected = option.value === selected;
              return (
                <div
                  key={option.value}
                  id={optionId(i)}
                  role="option"
                  className="cherry-combobox__option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  data-active={i === active || undefined}
                  onMouseMove={() => {
                    if (i !== active && !option.disabled) setActive(i);
                  }}
                  onClick={() => {
                    if (!option.disabled) commit(option);
                  }}
                >
                  <span className="cherry-combobox__option-label">
                    {option.label}
                  </span>
                  <Check
                    className="cherry-combobox__check"
                    aria-hidden="true"
                  />
                </div>
              );
            })}
          </div>
          {shown.length === 0 ? (
            <div className="cherry-combobox__empty">
              <p className="cherry-combobox__empty-title">{emptyMessage}</p>
              {emptyHint ? (
                <p className="cherry-combobox__empty-hint">{emptyHint}</p>
              ) : null}
            </div>
          ) : null}
        </div>
        <span className="cherry-sr-only" aria-live="polite" aria-atomic="true">
          {open && query !== null ? resultsLabel(filtered.length) : ""}
        </span>
        {name ? (
          <input type="hidden" name={name} value={selected ?? ""} />
        ) : null}
      </div>
    );
  },
);
