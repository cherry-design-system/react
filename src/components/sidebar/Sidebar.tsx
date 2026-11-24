import {
  forwardRef,
  useId,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "../../utils/cx";

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  /** Top slot: logo, workspace switcher, collapse button. */
  header?: ReactNode;
  /** Bottom slot: account, settings. */
  footer?: ReactNode;
  /** Icon rail: labels, badges and group titles hide, width eases to 64px. */
  collapsed?: boolean;
  /** Names the navigation landmark. Defaults to "Sidebar". */
  navLabel?: string;
}

/**
 * App sidebar: an `<aside>` with header, a `<nav>` of SidebarGroups, and a
 * footer. No client JS: collapsible groups are native `<details>`, the
 * active item is plain `aria-current`, and `collapsed` is a prop you drive.
 */
export const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  {
    header,
    footer,
    collapsed,
    navLabel = "Sidebar",
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <aside
      ref={ref}
      className={cx("cherry-sidebar", className)}
      data-collapsed={collapsed || undefined}
      {...rest}
    >
      {header ? <div className="cherry-sidebar__header">{header}</div> : null}
      <nav className="cherry-sidebar__nav" aria-label={navLabel}>
        {children}
      </nav>
      {footer ? <div className="cherry-sidebar__footer">{footer}</div> : null}
    </aside>
  );
});

export interface SidebarGroupProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "title"
> {
  /** Group title (rendered as an eyebrow). Optional. */
  label?: ReactNode;
  /** Makes the title a native disclosure that folds the group. */
  collapsible?: boolean;
  /** Initial state of a collapsible group. Defaults to open. */
  defaultOpen?: boolean;
}

/** A titled list of SidebarItems, optionally collapsible via `<details>`. */
export const SidebarGroup = forwardRef<HTMLElement, SidebarGroupProps>(
  function SidebarGroup(
    { label, collapsible, defaultOpen = true, className, children, ...rest },
    ref,
  ) {
    const labelId = useId();
    const list = <ul className="cherry-sidebar__list">{children}</ul>;

    if (collapsible && label) {
      return (
        <details
          ref={ref as Ref<HTMLDetailsElement>}
          className={cx("cherry-sidebar__group", className)}
          open={defaultOpen}
          {...rest}
        >
          <summary className="cherry-sidebar__group-label">
            <span>{label}</span>
            <ChevronDown
              className="cherry-sidebar__group-chevron"
              aria-hidden="true"
            />
          </summary>
          {list}
        </details>
      );
    }

    return (
      <div
        ref={ref as Ref<HTMLDivElement>}
        role={label ? "group" : undefined}
        aria-labelledby={label ? labelId : undefined}
        className={cx("cherry-sidebar__group", className)}
        {...rest}
      >
        {label ? (
          <div id={labelId} className="cherry-sidebar__group-label">
            {label}
          </div>
        ) : null}
        {list}
      </div>
    );
  },
);

export interface SidebarItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Leading icon (e.g. a lucide element). Stays visible when collapsed. */
  icon?: ReactNode;
  /** Trailing count or Badge. */
  badge?: ReactNode;
  /** Marks the current item (aria-current="page" on links, "true" on buttons). */
  active?: boolean;
  /** Only for the button form (no `href`). */
  disabled?: boolean;
}

/**
 * One sidebar entry, in its own `<li>`. With `href` it is a link, without
 * it a button (pass `onClick` from a Client Component).
 */
export const SidebarItem = forwardRef<HTMLElement, SidebarItemProps>(
  function SidebarItem(
    { icon, badge, active, disabled, className, children, href, ...rest },
    ref,
  ) {
    const content = (
      <>
        {icon ? (
          <span className="cherry-sidebar__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className="cherry-sidebar__label">{children}</span>
        {badge !== undefined && badge !== null ? (
          <span className="cherry-sidebar__badge">{badge}</span>
        ) : null}
      </>
    );
    return (
      <li className="cherry-sidebar__item">
        {href !== undefined ? (
          <a
            ref={ref as Ref<HTMLAnchorElement>}
            href={href}
            className={cx("cherry-sidebar__link", className)}
            aria-current={active ? "page" : undefined}
            {...rest}
          >
            {content}
          </a>
        ) : (
          <button
            ref={ref as Ref<HTMLButtonElement>}
            type="button"
            className={cx("cherry-sidebar__link", className)}
            aria-current={active ? "true" : undefined}
            disabled={disabled}
            {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
          >
            {content}
          </button>
        )}
      </li>
    );
  },
);
