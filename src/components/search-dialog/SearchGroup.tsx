import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../../utils/cx";

export interface SearchGroupProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  /** Small all-caps heading over the group; names it for assistive tech. */
  label: ReactNode;
}

/** A labelled group of <SearchResult>s inside a <SearchDialog>. */
export const SearchGroup = forwardRef<HTMLDivElement, SearchGroupProps>(
  function SearchGroup({ label, className, children, ...rest }, ref) {
    const id = useId();
    const labelId = `${id}-label`;
    return (
      <div
        ref={ref}
        role="group"
        aria-labelledby={labelId}
        className={cx("cherry-search-dialog__group", className)}
        {...rest}
      >
        <div className="cherry-search-dialog__group-label" id={labelId}>
          {label}
        </div>
        {children}
      </div>
    );
  },
);
