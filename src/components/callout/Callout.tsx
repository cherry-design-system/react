import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import {
  CircleCheck,
  CircleX,
  FileText,
  Info,
  TriangleAlert,
} from "lucide-react";
import { cx } from "../../utils/cx";
import type { CalloutVariant } from "./variants.gen";

export interface CalloutProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  /** Status color and default icon. Defaults to `neutral`. */
  variant?: CalloutVariant;
  /** Bold first line. Optional. */
  title?: ReactNode;
  /** Replaces the variant's icon; pass `null` for no icon. */
  icon?: ReactNode | null;
}

const ICONS: Record<CalloutVariant, typeof Info> = {
  neutral: FileText,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleX,
};

/**
 * Inline message box for supplementary, cautionary or critical notes.
 * Static content (no live region); use a Toast for transient feedback.
 * No client JS: safe in Server Components.
 */
export const Callout = forwardRef<HTMLDivElement, CalloutProps>(
  function Callout(
    { variant = "neutral", title, icon, className, children, ...rest },
    ref,
  ) {
    const Glyph = ICONS[variant];
    const glyph = icon === undefined ? <Glyph /> : icon;
    return (
      <div
        ref={ref}
        className={cx("cherry-callout", className)}
        data-variant={variant}
        {...rest}
      >
        {glyph ? (
          <span className="cherry-callout__icon" aria-hidden="true">
            {glyph}
          </span>
        ) : null}
        <div className="cherry-callout__content">
          {title ? <p className="cherry-callout__title">{title}</p> : null}
          {children ? (
            <div className="cherry-callout__body">{children}</div>
          ) : null}
        </div>
      </div>
    );
  },
);
