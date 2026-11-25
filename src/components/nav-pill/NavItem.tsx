import {
  cloneElement,
  forwardRef,
  isValidElement,
  type AnchorHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cx } from "../../utils/cx";

export interface NavItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Marks the current page (sets aria-current="page"). */
  active?: boolean;
  /** Optional leading icon. */
  icon?: ReactNode;
  /**
   * Render your own link element (a router link such as Next.js `<Link>`) as
   * the item: pass it as the only child and NavItem gives it the item's
   * class, state and icon. It must render an `<a href>`.
   */
  asChild?: boolean;
}

type ChildLinkProps = {
  className?: string;
  children?: ReactNode;
};

/**
 * One link in a NavPill (renders its own `<li>`). No client JS: the active
 * state is plain `aria-current`, so it renders in Server Components.
 */
export const NavItem = forwardRef<HTMLAnchorElement, NavItemProps>(
  function NavItem(
    { active, icon, asChild, className, children, ...rest },
    ref,
  ) {
    const iconNode = icon ? (
      <span className="cherry-nav-item__icon" aria-hidden="true">
        {icon}
      </span>
    ) : null;
    const linkProps = {
      className: cx("cherry-nav-item__link", className),
      "aria-current": active ? ("page" as const) : undefined,
      ...rest,
    };

    if (asChild && isValidElement<ChildLinkProps>(children)) {
      const child = children as ReactElement<ChildLinkProps>;
      return (
        <li className="cherry-nav-item">
          {cloneElement(
            child,
            {
              ...linkProps,
              className: cx(linkProps.className, child.props.className),
              ...(ref ? { ref } : {}),
            } as ChildLinkProps,
            iconNode,
            child.props.children,
          )}
        </li>
      );
    }

    return (
      <li className="cherry-nav-item">
        <a ref={ref} {...linkProps}>
          {iconNode}
          {children}
        </a>
      </li>
    );
  },
);
