import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../../utils/cx";
import type { CardPadding, CardVariant } from "./variants.gen";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** outline (border), elevated (border + shadow), filled (subtle fill). Defaults to "outline". */
  variant?: CardVariant;
  /** Inner padding. Defaults to "md" (20px). */
  padding?: CardPadding;
  /** Lifts on hover, for cards that hold a single link or button. */
  interactive?: boolean;
}

/** A surface (the Figma "Box"). No client JS. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = "outline", padding = "md", interactive, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("cherry-card", className)}
      data-variant={variant}
      data-padding={padding}
      data-interactive={interactive || undefined}
      {...rest}
    />
  );
});

export interface CardIconProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

/** Small icon tile at the top of a card. */
export const CardIcon = forwardRef<HTMLSpanElement, CardIconProps>(
  function CardIcon({ className, ...rest }, ref) {
    return (
      <span
        ref={ref}
        className={cx("cherry-card__icon", className)}
        aria-hidden="true"
        {...rest}
      />
    );
  },
);

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Heading level. Defaults to 3. */
  level?: 2 | 3 | 4 | 5 | 6;
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  function CardTitle({ level = 3, className, ...rest }, ref) {
    const Tag = `h${level}` as const;
    return (
      <Tag
        ref={ref}
        className={cx("cherry-card__title", className)}
        {...rest}
      />
    );
  },
);

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...rest }, ref) {
  return (
    <p
      ref={ref}
      className={cx("cherry-card__description", className)}
      {...rest}
    />
  );
});
