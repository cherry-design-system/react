import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";
import type { ProseSize } from "./variants.gen";

export interface ProseProps extends HTMLAttributes<HTMLDivElement> {
  /** Base text size: body-sm / body-md / body-lg. Defaults to "md". */
  size?: ProseSize;
  /** Tighter rhythm and smaller headings, for chat replies and cards. */
  compact?: boolean;
}

/**
 * Typography for rich text you do not style element by element (rendered
 * markdown, CMS content): headings, paragraphs, links, lists, quotes, code,
 * tables and media, all from the text tokens. Renders children as given;
 * never pass it unsanitized HTML. No client JS.
 */
export const Prose = forwardRef<HTMLDivElement, ProseProps>(function Prose(
  { size = "md", compact, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("cherry-prose", className)}
      data-size={size}
      data-compact={compact || undefined}
      {...rest}
    />
  );
});
