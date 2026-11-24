"use client";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cx } from "../../utils/cx";
import { useMenu } from "../menu/menu-context";
import type { MenuItemVariant } from "./variants.gen";

export interface MenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon before the label (e.g. <Copy />). */
  icon?: ReactNode;
  /** Visual shortcut hint at the end (e.g. "⌘C"); pass aria-keyshortcuts for assistive tech. */
  shortcut?: ReactNode;
  /** "danger" for destructive actions. Defaults to "default". */
  variant?: MenuItemVariant;
}

/**
 * One action in a <Menu> (role="menuitem"). Choosing it runs onClick, then
 * closes the menu unless onClick called preventDefault(). Disabled items
 * stay visible but are skipped by the keyboard and do nothing.
 */
export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(
  function MenuItem(
    {
      icon,
      shortcut,
      variant = "default",
      disabled,
      className,
      children,
      onClick,
      onPointerMove,
      type,
      ...rest
    },
    ref,
  ) {
    const menu = useMenu();
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (disabled) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
      if (!event.defaultPrevented) menu?.close();
    };
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        role="menuitem"
        tabIndex={-1}
        aria-disabled={disabled || undefined}
        className={cx("cherry-menu-item", className)}
        data-variant={variant}
        onClick={handleClick}
        onPointerMove={(event) => {
          onPointerMove?.(event);
          // Hover and keyboard share one highlight: the focused item.
          if (!disabled && document.activeElement !== event.currentTarget)
            event.currentTarget.focus({ preventScroll: true });
        }}
        {...rest}
      >
        {icon ? (
          <span className="cherry-menu-item__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className="cherry-menu-item__label">{children}</span>
        {shortcut ? (
          <kbd className="cherry-menu-item__shortcut" aria-hidden="true">
            {shortcut}
          </kbd>
        ) : null}
      </button>
    );
  },
);
