import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../../utils/cx";

export interface MenuGroupProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  /** Small all-caps heading over the group; names it for assistive tech. */
  label?: ReactNode;
}

/** A labelled run of menu items (role="group"). */
export const MenuGroup = forwardRef<HTMLDivElement, MenuGroupProps>(
  function MenuGroup({ label, className, children, ...rest }, ref) {
    const id = useId();
    const labelId = `${id}-label`;
    return (
      <div
        ref={ref}
        role="group"
        aria-labelledby={label ? labelId : undefined}
        className={cx("cherry-menu__group", className)}
        {...rest}
      >
        {label ? (
          <div className="cherry-menu__label" id={labelId} aria-hidden="true">
            {label}
          </div>
        ) : null}
        {children}
      </div>
    );
  },
);

export type MenuSeparatorProps = HTMLAttributes<HTMLDivElement>;

/** A divider between groups of menu items. */
export const MenuSeparator = forwardRef<HTMLDivElement, MenuSeparatorProps>(
  function MenuSeparator({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        role="separator"
        className={cx("cherry-menu__separator", className)}
        {...rest}
      />
    );
  },
);
