"use client";
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type AnimationEvent,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
} from "react";
import { X } from "lucide-react";
import { cx } from "../../utils/cx";
import { mergeRefs } from "../../utils/merge-refs";
import type { TagSize, TagVariant } from "./variants.gen";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  size?: TagSize;
  /**
   * Shows the remove button. Called once the exit animation has finished:
   * drop the tag from your list there.
   */
  onRemove?: () => void;
  /** Remove button name, followed by the tag text. Defaults to "Remove". */
  removeLabel?: string;
  /** Disables the remove button. */
  disabled?: boolean;
}

// Safety net when no animationend arrives (stylesheet missing).
const EXIT_MS = 500;

/** Value chip, optionally removable. Removal shrinks and fades it out. */
export const Tag = forwardRef<HTMLSpanElement, TagProps>(function Tag(
  {
    variant = "neutral",
    size = "md",
    onRemove,
    removeLabel = "Remove",
    disabled,
    className,
    children,
    style,
    onAnimationEnd,
    ...rest
  },
  ref,
) {
  const rootRef = useRef<HTMLSpanElement>(null);
  // Measured when removal starts: the tag's width, and the flex/grid gap
  // after it, so both collapse together and the next tag slides in smoothly.
  const [exit, setExit] = useState<{ width: number; gap: number } | null>(null);
  const done = useRef(false);
  const exiting = exit !== null;

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onRemove?.();
  };

  useEffect(() => {
    if (!exiting) return;
    const timer = window.setTimeout(finish, EXIT_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exiting]);

  const remove = () => {
    if (exiting || disabled) return;
    const node = rootRef.current;
    const parent = node?.parentElement;
    const gap = parent ? parseFloat(getComputedStyle(parent).columnGap) : 0;
    setExit({
      width: node?.getBoundingClientRect().width ?? 0,
      gap: Number.isFinite(gap) ? gap : 0,
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      remove();
    }
  };

  return (
    <span
      ref={mergeRefs(ref, rootRef)}
      className={cx("cherry-tag", className)}
      data-variant={variant}
      data-size={size}
      data-exiting={exiting || undefined}
      style={
        exit
          ? ({
              ...style,
              "--_w": `${exit.width}px`,
              "--_gap": `${exit.gap}px`,
            } as CSSProperties)
          : style
      }
      onAnimationEnd={(event: AnimationEvent<HTMLSpanElement>) => {
        onAnimationEnd?.(event);
        if (exiting && event.target === event.currentTarget) finish();
      }}
      {...rest}
    >
      <span className="cherry-tag__label">{children}</span>
      {onRemove ? (
        <button
          type="button"
          className="cherry-tag__remove"
          aria-label={
            typeof children === "string" || typeof children === "number"
              ? `${removeLabel} ${children}`
              : removeLabel
          }
          disabled={disabled || exiting}
          onClick={remove}
          onKeyDown={onKeyDown}
        >
          <X aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );
});
