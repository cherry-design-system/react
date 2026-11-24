import {
  createElement,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Inbox } from "lucide-react";
import { cx } from "../../utils/cx";

export interface EmptyStateProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  /** Icon shown in a tile above the title. Defaults to an inbox; `null` hides it. */
  icon?: ReactNode | null;
  title: ReactNode;
  description?: ReactNode;
  /** Buttons or links under the text. */
  actions?: ReactNode;
  /** Heading level of the title. Defaults to 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

/**
 * Placeholder for an empty list, search with no results or a first run.
 * No client JS: safe in Server Components.
 */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  function EmptyState(
    {
      icon,
      title,
      description,
      actions,
      headingLevel = 3,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const glyph = icon === undefined ? <Inbox /> : icon;
    return (
      <div ref={ref} className={cx("cherry-empty-state", className)} {...rest}>
        {glyph ? (
          <span className="cherry-empty-state__icon" aria-hidden="true">
            {glyph}
          </span>
        ) : null}
        {createElement(
          `h${headingLevel}`,
          { className: "cherry-empty-state__title" },
          title,
        )}
        {description ? (
          <p className="cherry-empty-state__description">{description}</p>
        ) : null}
        {children}
        {actions ? (
          <div className="cherry-empty-state__actions">{actions}</div>
        ) : null}
      </div>
    );
  },
);
