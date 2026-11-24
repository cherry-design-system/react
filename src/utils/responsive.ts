import type { CSSProperties } from "react";

/** Breakpoint names, smallest first (tokens: --cherry-breakpoint-*). */
export const breakpoints = [
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "xxl",
  "xxxl",
] as const;
export type Breakpoint = (typeof breakpoints)[number];

/** A single value for every width, or values per breakpoint (mobile first). */
export type Responsive<T> = T | Partial<Record<Breakpoint, T>>;

/** Steps of the spacing scale (--cherry-space-<step>). */
export type SpaceStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;

export const space = (step: SpaceStep) => `var(--cherry-space-${step})`;

/**
 * Turns a responsive prop into the inline custom properties the layout CSS
 * reads (`--_<name>-<breakpoint>`). Values are written per breakpoint only;
 * the stylesheet carries each one up through the larger breakpoints.
 */
export function responsiveVars<T extends string | number>(
  name: string,
  value: Responsive<T> | undefined,
  toCss: (value: T) => string = String,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (value === undefined || value === null) return out;
  if (typeof value === "object") {
    for (const bp of breakpoints) {
      const v = value[bp];
      if (v !== undefined) out[`--_${name}-${bp}`] = toCss(v);
    }
  } else {
    out[`--_${name}-xs`] = toCss(value);
  }
  return out;
}

/** Merges generated custom properties with a caller's style (caller wins). */
export function withVars(
  vars: Record<string, string>,
  style: CSSProperties | undefined,
): CSSProperties | undefined {
  if (Object.keys(vars).length === 0) return style;
  return { ...(vars as CSSProperties), ...style };
}
