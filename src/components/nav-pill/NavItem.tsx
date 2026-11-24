import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";
import { cx } from "../../utils/cx";

export interface NavItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Marks the current page (sets aria-current="page"). */
  active?: boolean;
  /** Optional leading icon. */
  icon?: ReactNode;
}

/**
 * One link in a NavPill (renders its own `<li>`). No client JS: the active
 * state is plain `aria-current`, so it renders in Server Components.
 */
export const NavItem = forwardRef<HTMLAnchorElement, NavItemProps>(
  function NavItem({ active, icon, className, children, ...rest }, ref) {
    return (
      <li className="cherry-nav-item">
        <a
          ref={ref}
          className={cx("cherry-nav-item__link", className)}
          aria-current={active ? "page" : undefined}
          {...rest}
        >
          {icon ? (
            <span className="cherry-nav-item__icon" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          {children}
        </a>
      </li>
    );
  },
);
