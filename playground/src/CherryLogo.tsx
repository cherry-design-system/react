// The cherry 2.0 logo, from the Figma kit (Assets: Brand/Glyph and
// Brand/Lockup). The glyph is two overlapping cherries with the overlap in
// the deep tone; the wordmark is Geist Bold with the "rr" in the two cherry
// tones. Cherry colors are fixed primitives; the rest of the wordmark takes
// fg-default, so one component serves both modes.
// `compact` draws Brand/Mark instead: the glyph on a primary tile (22.5%
// corner radius) that inverts with the mode, for a collapsed sidebar or rail.
import type { CSSProperties, HTMLAttributes } from "react";

type CherryLogoProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  /** The app mark (glyph on a tile) instead of the lockup. */
  compact?: boolean;
  /**
   * Glyph height in px for the lockup (the wordmark scales with it), or the
   * tile size for the compact mark. Defaults to 24.
   */
  size?: number;
  /** The accessible name; the logo is decorative when omitted. */
  title?: string;
};

// Lockup proportions from Figma: 32px glyph, 34px wordmark, 12px gap.
const FONT_RATIO = 34 / 32;

export function CherryLogo({
  compact,
  size = 24,
  title,
  style,
  ...props
}: CherryLogoProps) {
  return (
    <span
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={
        {
          display: "inline-flex",
          alignItems: "center",
          gap: "calc(12em / 34)",
          fontSize: size * FONT_RATIO,
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      <svg
        viewBox={compact ? "0 0 512 512" : "104 160 304 192"}
        style={{ height: size, width: "auto", flexShrink: 0 }}
        aria-hidden="true"
      >
        {compact ? (
          <rect
            width="512"
            height="512"
            rx="115"
            fill="var(--cherry-primary-default)"
          />
        ) : null}
        <circle cx="200" cy="256" r="96" fill="var(--cherry-cherry-400)" />
        <circle cx="312" cy="256" r="96" fill="var(--cherry-cherry-600)" />
        <path
          d="M256 178.019C280.225 195.445 296 223.88 296 256C296 288.12 280.224 316.554 256 333.98C231.776 316.554 216 288.12 216 256C216 223.88 231.775 195.445 256 178.019Z"
          fill="var(--cherry-cherry-900)"
        />
      </svg>
      {compact ? null : (
        <span
          aria-hidden="true"
          style={{
            color: "var(--cherry-fg-default)",
            fontFamily: "var(--cherry-font-sans)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          che
          <span style={{ color: "var(--cherry-cherry-400)" }}>r</span>
          <span style={{ color: "var(--cherry-cherry-600)" }}>r</span>y
        </span>
      )}
    </span>
  );
}
