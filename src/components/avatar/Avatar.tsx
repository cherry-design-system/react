"use client";
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { User } from "lucide-react";
import { cx } from "../../utils/cx";
import type { AvatarColor, AvatarSize, AvatarStatus } from "./variants.gen";

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** Image URL. Initials (then the icon) show until it loads, and if it fails. */
  src?: string;
  /** Accessible name. Defaults to `name`. */
  alt?: string;
  /** Full name; the first letters of its first two words are the initials. */
  name?: string;
  /** Fallback icon when there is no image and no name. Defaults to a user glyph. */
  icon?: ReactNode;
  /** 24 / 32 / 40 / 56 px. Defaults to "md". */
  size?: AvatarSize;
  /** Fill behind initials and icon. Defaults to "neutral". */
  color?: AvatarColor;
  /** Presence dot on the bottom-right edge. */
  status?: AvatarStatus;
  /** Spoken status names, translatable. */
  statusLabels?: Partial<Record<AvatarStatus, string>>;
}

const defaultStatusLabels: Record<AvatarStatus, string> = {
  online: "Online",
  away: "Away",
  busy: "Busy",
  offline: "Offline",
};

/** "Ada Lovelace" -> "AL", "cherry" -> "C". */
export function toInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? "")
    .join("")
    .toUpperCase();
}

type ImageState = "loading" | "loaded" | "error";

/**
 * Round avatar: image, initials or icon, with an optional status dot. The
 * image fades in over the initials once it has loaded and falls back to them
 * if it fails.
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  {
    src,
    alt,
    name,
    icon,
    size = "md",
    color = "neutral",
    status,
    statusLabels,
    className,
    ...rest
  },
  ref,
) {
  const [image, setImage] = useState<ImageState>("loading");
  const imgRef = useRef<HTMLImageElement>(null);

  // A new source starts over. An image that finished before hydration never
  // fires onLoad for React, so check the element directly.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setImage("loaded");
    else setImage("loading");
  }, [src]);

  const initials = name ? toInitials(name) : "";
  const label = alt ?? name;
  const statusLabel = status
    ? (statusLabels?.[status] ?? defaultStatusLabels[status])
    : undefined;
  const accessibleName =
    label && statusLabel ? `${label} (${statusLabel})` : (label ?? statusLabel);
  const showImage = Boolean(src) && image !== "error";

  return (
    <span
      ref={ref}
      className={cx("cherry-avatar", className)}
      data-size={size}
      data-color={color}
      data-status={status}
      data-loaded={showImage && image === "loaded" ? "" : undefined}
      role={accessibleName ? "img" : undefined}
      aria-label={accessibleName}
      {...rest}
    >
      <span className="cherry-avatar__fallback" aria-hidden="true">
        {initials || icon || <User />}
      </span>
      {showImage ? (
        <img
          ref={imgRef}
          className="cherry-avatar__image"
          src={src}
          alt=""
          onLoad={() => setImage("loaded")}
          onError={() => setImage("error")}
        />
      ) : null}
      {status ? (
        <span className="cherry-avatar__status" aria-hidden="true" />
      ) : null}
    </span>
  );
});
