import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../../utils/cx";
import type { PopoverAlign, PopoverPlacement } from "./variants.gen";

export interface PopoverProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title" | "popover"
> {
  /** Required: the trigger points at it with `popoverTarget={id}`. */
  id: string;
  /** Side of the trigger it opens on. Defaults to "bottom". */
  placement?: PopoverPlacement;
  /** Alignment along that side. Defaults to "center". */
  align?: PopoverAlign;
  /** Heading; also the popover's accessible name. */
  title?: ReactNode;
  /** Buttons at the bottom, aligned to the end. */
  actions?: ReactNode;
  /**
   * "auto" (default) closes on Escape, an outside click or another popover
   * opening; "manual" only closes when told to.
   */
  mode?: "auto" | "manual";
}

/**
 * A floating panel on the native `popover` attribute, positioned against
 * its trigger with CSS anchor positioning. No client JS: point a button at
 * it with `popoverTarget={id}` (the invoker is the anchor) and the browser
 * opens, closes and light-dismisses it. It scales and fades in from the
 * trigger's side, and back out.
 */
export const Popover = forwardRef<HTMLDivElement, PopoverProps>(
  function Popover(
    {
      id,
      placement = "bottom",
      align = "center",
      title,
      actions,
      mode = "auto",
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const titleId = `${id}-title`;
    return (
      <div
        ref={ref}
        id={id}
        popover={mode}
        role={title ? "dialog" : undefined}
        aria-labelledby={title ? titleId : undefined}
        className={cx("cherry-popover", className)}
        data-placement={placement}
        data-align={align}
        {...rest}
      >
        {title ? (
          <p className="cherry-popover__title" id={titleId}>
            {title}
          </p>
        ) : null}
        {children ? (
          <div className="cherry-popover__body">{children}</div>
        ) : null}
        {actions ? (
          <div className="cherry-popover__actions">{actions}</div>
        ) : null}
      </div>
    );
  },
);
