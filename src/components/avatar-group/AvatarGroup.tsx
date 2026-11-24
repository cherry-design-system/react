import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type HTMLAttributes,
  type ReactElement,
} from "react";
import { cx } from "../../utils/cx";
import type { AvatarProps } from "../avatar";
import type { AvatarGroupSize } from "./variants.gen";

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Avatars shown before the rest collapse into a "+N" counter. */
  max?: number;
  /** Size given to every avatar that does not set its own. Defaults to "md". */
  size?: AvatarGroupSize;
  /** Spoken text of the counter. Defaults to "{count} more". */
  overflowLabel?: (count: number) => string;
}

/** Overlapping row of <Avatar>s with a "+N" counter. No client JS. */
export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  function AvatarGroup(
    {
      max,
      size = "md",
      overflowLabel = (count) => `${count} more`,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const items = Children.toArray(children).filter(isValidElement);
    const visible =
      max !== undefined ? items.slice(0, Math.max(0, max)) : items;
    const hidden = items.length - visible.length;
    return (
      <div
        ref={ref}
        role="group"
        className={cx("cherry-avatar-group", className)}
        data-size={size}
        {...rest}
      >
        {visible.map((child) => {
          const avatar = child as ReactElement<AvatarProps>;
          return avatar.props.size ? avatar : cloneElement(avatar, { size });
        })}
        {hidden > 0 ? (
          <span
            className="cherry-avatar cherry-avatar-group__overflow"
            data-size={size}
            data-color="neutral"
            role="img"
            aria-label={overflowLabel(hidden)}
          >
            <span className="cherry-avatar__fallback" aria-hidden="true">
              +{hidden}
            </span>
          </span>
        ) : null}
      </div>
    );
  },
);
