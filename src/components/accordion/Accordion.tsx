import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type DetailsHTMLAttributes,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  useId,
} from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "../../utils/cx";
import type { AccordionVariant } from "./variants.gen";

export interface AccordionItemProps extends Omit<
  DetailsHTMLAttributes<HTMLDetailsElement>,
  "title"
> {
  /** The always-visible heading (the `<summary>`). */
  title: ReactNode;
  /** `card` (bordered surface, default) or `inline` (divider lines). */
  variant?: AccordionVariant;
  /** Starts open (uncontrolled). Use `open` + `onToggle` for controlled use. */
  defaultOpen?: boolean;
}

/**
 * One disclosure built on native `<details>` / `<summary>`: keyboard,
 * find-in-page and assistive tech work without client JS. Items sharing a
 * `name` open one at a time (native exclusive accordion).
 */
export const AccordionItem = forwardRef<HTMLDetailsElement, AccordionItemProps>(
  function AccordionItem(
    {
      title,
      variant = "card",
      defaultOpen,
      open,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <details
        ref={ref}
        className={cx("cherry-accordion__item", className)}
        data-variant={variant}
        open={open ?? defaultOpen}
        {...rest}
      >
        <summary className="cherry-accordion__trigger">
          <span className="cherry-accordion__title">{title}</span>
          <ChevronDown
            className="cherry-accordion__chevron"
            aria-hidden="true"
          />
        </summary>
        <div className="cherry-accordion__body">{children}</div>
      </details>
    );
  },
);

export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  /** Applied to every item that does not set its own. Defaults to `card`. */
  variant?: AccordionVariant;
  /**
   * `single` lets one item open at a time (items share a native `name`);
   * `multiple` (default) lets any number open.
   */
  type?: "single" | "multiple";
  /** The group name used by `type="single"`. Generated when omitted. */
  name?: string;
  children?: ReactNode;
}

/** A stack of AccordionItems. No client JS: safe in Server Components. */
export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  function Accordion(
    { variant = "card", type = "multiple", name, className, children, ...rest },
    ref,
  ) {
    // useId is stable across server and client renders (no hydration drift).
    const generated = useId();
    const group = type === "single" ? (name ?? generated) : undefined;
    return (
      <div
        ref={ref}
        className={cx("cherry-accordion", className)}
        data-variant={variant}
        {...rest}
      >
        {Children.map(children, (child) => {
          if (!isValidElement(child) || child.type !== AccordionItem)
            return child;
          const item = child as ReactElement<AccordionItemProps>;
          return cloneElement(item, {
            variant: item.props.variant ?? variant,
            name: item.props.name ?? group,
          });
        })}
      </div>
    );
  },
);
