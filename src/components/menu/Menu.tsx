"use client";
import {
  cloneElement,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { cx } from "../../utils/cx";
import { MenuContext } from "./menu-context";
import type { MenuAlign, MenuPlacement } from "./variants.gen";

type TriggerProps = {
  id?: string;
  className?: string;
  style?: CSSProperties;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  popoverTarget?: string;
  "aria-haspopup"?: "menu";
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
};

export interface MenuProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "popover" | "children"
> {
  /** The button that opens the menu (a <Button> or <IconButton>). */
  trigger: ReactElement<TriggerProps>;
  /** <MenuItem>, <MenuGroup> and <MenuSeparator> elements. */
  children: ReactNode;
  /** Side of the trigger. Defaults to "bottom". */
  placement?: MenuPlacement;
  /** Alignment along that side. Defaults to "start". */
  align?: MenuAlign;
  /** Called when the menu opens or closes. */
  onOpenChange?: (open: boolean) => void;
}

const ITEM = '[role="menuitem"]:not([aria-disabled="true"])';

/**
 * A menu button: the trigger opens a `popover` menu (role="menu") anchored
 * to it. Arrow keys, Home/End and typeahead move between items, Escape or
 * Tab close it and focus returns to the trigger. It scales and fades in
 * from the trigger's side, and back out, in CSS.
 */
export const Menu = forwardRef<HTMLDivElement, MenuProps>(function Menu(
  {
    trigger,
    children,
    placement = "bottom",
    align = "start",
    onOpenChange,
    className,
    style,
    onKeyDown,
    id: idProp,
    "aria-label": ariaLabel,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const menuId = idProp ?? `cherry-menu-${autoId}`;
  const triggerId = trigger.props.id ?? `${menuId}-trigger`;
  const anchor = `--cherry-menu-${autoId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const pendingFocus = useRef<"first" | "last">("first");
  const typeahead = useRef({ text: "", at: 0 });
  const [open, setOpen] = useState(false);
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });

  const setMenu = useCallback(
    (node: HTMLDivElement | null) => {
      menuRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const items = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>(ITEM) ?? []);

  const focusItem = (index: number) => {
    const list = items();
    if (list.length === 0) return;
    const next = list[(index + list.length) % list.length];
    next?.focus();
  };

  const close = useCallback(() => {
    const menu = menuRef.current;
    try {
      menu?.hidePopover();
    } catch {
      // Already closed.
    }
  }, []);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    triggerRef.current = document.getElementById(triggerId);
    const onToggle = (event: Event) => {
      const isOpen = (event as ToggleEvent).newState === "open";
      setOpen(isOpen);
      onOpenChangeRef.current?.(isOpen);
      if (isOpen) {
        const list = Array.from(menu.querySelectorAll<HTMLElement>(ITEM));
        const target =
          pendingFocus.current === "last" ? list[list.length - 1] : list[0];
        pendingFocus.current = "first";
        (target ?? menu).focus();
      } else {
        // Focus left with the menu (Escape, an item chosen): back to the
        // trigger. A click elsewhere keeps the focus it moved to.
        const active = document.activeElement;
        if (!active || active === document.body || menu.contains(active))
          triggerRef.current?.focus();
      }
    };
    menu.addEventListener("toggle", onToggle);
    return () => menu.removeEventListener("toggle", onToggle);
  }, [triggerId]);

  const openWith = (focus: "first" | "last") => {
    pendingFocus.current = focus;
    const menu = menuRef.current;
    try {
      if (!open) menu?.showPopover();
      else focusItem(focus === "first" ? 0 : -1);
    } catch {
      // Not connected.
    }
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    trigger.props.onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openWith("first");
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openWith("last");
    }
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const list = items();
    const current = list.indexOf(document.activeElement as HTMLElement);
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusItem(current + 1);
        return;
      case "ArrowUp":
        event.preventDefault();
        focusItem(current < 0 ? -1 : current - 1);
        return;
      case "Home":
        event.preventDefault();
        focusItem(0);
        return;
      case "End":
        event.preventDefault();
        focusItem(-1);
        return;
      case "Escape":
        event.preventDefault();
        close();
        return;
      case "Tab":
        close();
        return;
    }
    // Typeahead: printable keys jump to the next item starting with them.
    if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      const now = Date.now();
      const state = typeahead.current;
      state.text = (now - state.at > 500 ? "" : state.text) + event.key;
      state.at = now;
      const query = state.text.toLowerCase();
      const ordered = [
        ...list.slice(current + 1),
        ...list.slice(0, current + 1),
      ];
      if (state.text.length > 1 && current >= 0)
        ordered.unshift(list[current]!);
      const match = ordered.find((item) =>
        (item.textContent ?? "").trim().toLowerCase().startsWith(query),
      );
      if (match) {
        event.preventDefault();
        match.focus();
      }
    }
  };

  const context = useMemo(() => ({ close }), [close]);
  const anchorStyle = { "--_anchor": anchor } as CSSProperties;

  return (
    <>
      {cloneElement(trigger, {
        id: triggerId,
        popoverTarget: menuId,
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": menuId,
        className: cx(trigger.props.className, "cherry-menu__trigger"),
        style: { ...trigger.props.style, ...anchorStyle },
        onKeyDown: onTriggerKeyDown,
      })}
      <div
        ref={setMenu}
        id={menuId}
        popover="auto"
        role="menu"
        tabIndex={-1}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : triggerId}
        className={cx("cherry-menu", className)}
        data-placement={placement}
        data-align={align}
        style={{ ...anchorStyle, ...style }}
        onKeyDown={onMenuKeyDown}
        {...rest}
      >
        <MenuContext.Provider value={context}>{children}</MenuContext.Provider>
      </div>
    </>
  );
});
