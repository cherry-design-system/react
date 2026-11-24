import { forwardRef, type AnchorHTMLAttributes } from "react";
import { ArrowUpRight } from "lucide-react";
import { cx } from "../../utils/cx";
import type { LinkVariant } from "./variants.gen";

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** default: underlined text color; muted: gray until hovered. Defaults to "default". */
  variant?: LinkVariant;
  /** Opens in a new tab (rel="noopener noreferrer") and shows an arrow icon. */
  external?: boolean;
  /** Spoken after the text of an external link. Defaults to "(opens in a new tab)". */
  externalLabel?: string;
}

/**
 * Text link. The underline sweeps in on hover, the external arrow nudges
 * toward its target, and focus draws a ring offset from the text. Router
 * links can take the same look with className="cherry-link" plus
 * data-variant. No client JS.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  {
    variant = "default",
    external,
    externalLabel = "(opens in a new tab)",
    className,
    children,
    target,
    rel,
    ...rest
  },
  ref,
) {
  return (
    <a
      ref={ref}
      className={cx("cherry-link", className)}
      data-variant={variant}
      data-external={external || undefined}
      target={external ? (target ?? "_blank") : target}
      rel={external ? (rel ?? "noopener noreferrer") : rel}
      {...rest}
    >
      {children}
      {external ? (
        <>
          <ArrowUpRight className="cherry-link__icon" aria-hidden="true" />
          <span className="cherry-sr-only"> {externalLabel}</span>
        </>
      ) : null}
    </a>
  );
});
