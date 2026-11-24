import {
  Fragment,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { ChevronRight, Slash } from "lucide-react";
import { cx } from "../../utils/cx";
import type { BreadcrumbSeparator } from "./variants.gen";

export interface BreadcrumbEntry {
  label: ReactNode;
  /** Omit on the last entry: it is the current page. */
  href?: string;
}

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  /** Trail from the root to the current page (the last entry). */
  items: BreadcrumbEntry[];
  /** Glyph between entries. Defaults to `chevron`. */
  separator?: BreadcrumbSeparator;
  /** Names the landmark. Defaults to "Breadcrumb". */
  "aria-label"?: string;
}

/**
 * Breadcrumb trail: `<nav>` with an ordered list, the last entry marked
 * aria-current="page". No client JS: safe in Server Components.
 */
export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  function Breadcrumb(
    {
      items,
      separator = "chevron",
      className,
      "aria-label": ariaLabel = "Breadcrumb",
      ...rest
    },
    ref,
  ) {
    const Glyph = separator === "slash" ? Slash : ChevronRight;
    return (
      <nav
        ref={ref}
        aria-label={ariaLabel}
        className={cx("cherry-breadcrumb", className)}
        data-separator={separator}
        {...rest}
      >
        <ol className="cherry-breadcrumb__list">
          {items.map((item, i) => {
            const last = i === items.length - 1;
            return (
              <Fragment key={i}>
                <li className="cherry-breadcrumb__item">
                  {last ? (
                    <span
                      className="cherry-breadcrumb__current"
                      aria-current="page"
                    >
                      {item.label}
                    </span>
                  ) : item.href !== undefined ? (
                    <a className="cherry-breadcrumb__link" href={item.href}>
                      {item.label}
                    </a>
                  ) : (
                    <span className="cherry-breadcrumb__link">
                      {item.label}
                    </span>
                  )}
                </li>
                {last ? null : (
                  <li
                    className="cherry-breadcrumb__separator"
                    role="presentation"
                    aria-hidden="true"
                  >
                    <Glyph />
                  </li>
                )}
              </Fragment>
            );
          })}
        </ol>
      </nav>
    );
  },
);
