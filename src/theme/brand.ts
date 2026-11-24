// Brand theming without a runtime: createBrand() returns a CSS block for a
// `[data-cherry-brand="<name>"]` scope that overrides the paired color slots
// (--cherry-l-* / --cherry-d-*). Ship the CSS in your stylesheet (works under
// a strict `style-src 'self'` CSP) and put `data-cherry-brand="<name>"` on any
// element; nested light/dark scopes keep working because cherry redeclares
// the resolved tokens on every scope.

export interface BrandColors {
  /** The brand accent. One color for both modes, or one per mode. */
  accent: string | { light: string; dark: string };
  /** Optional primary (solid buttons, toggles). Defaults to cherry's near-black / near-white. */
  primary?: { light: string; dark: string; fgLight?: string; fgDark?: string };
}

export interface Brand {
  name: string;
  css: string;
  /** Spread onto the element that scopes the brand. */
  attributes: { "data-cherry-brand": string };
}

const NAME = /^[a-z][a-z0-9-]{0,39}$/;
// Accept plain color syntaxes only. No var(), keywords like initial/inherit,
// declarations, comments, quotes or newlines can reach the stylesheet.
const COLOR =
  /^(#[0-9a-f]{3,8}|(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\(\s*[0-9.%+\-\s,/]+\s*\)|[a-z]{3,20})$/i;
const FORBIDDEN_KEYWORDS = new Set([
  "initial",
  "inherit",
  "unset",
  "revert",
  "currentcolor",
  "transparent",
]);

export class BrandValidationError extends Error {}

/** Throws a BrandValidationError unless `value` is a safe, plain CSS color. */
export function assertBrandColor(value: string, label = "color"): string {
  const raw = String(value);
  const v = raw.trim();
  if (
    /[\u0000-\u001f\u007f]/.test(raw) ||
    !COLOR.test(v) ||
    FORBIDDEN_KEYWORDS.has(v.toLowerCase()) ||
    /var\(|[;{}<>"'\\\n\r]/.test(v)
  ) {
    throw new BrandValidationError(
      `Invalid brand ${label}: ${JSON.stringify(value)}`,
    );
  }
  return v;
}

const mix = (color: string, pct: number, other: string) =>
  `color-mix(in oklab, ${color} ${pct}%, ${other})`;

/**
 * Builds a brand scope. The accent ramp (hover, subtle, fg, ring) is derived
 * with color-mix, per mode, so one hex is enough.
 *
 *   const acme = createBrand("acme", { accent: "#5b5bd6" });
 *   // add acme.css to your stylesheet, then <div {...acme.attributes}>
 */
export function createBrand(name: string, colors: BrandColors): Brand {
  if (!NAME.test(name))
    throw new BrandValidationError(
      `Invalid brand name: ${JSON.stringify(name)}`,
    );
  const accentL = assertBrandColor(
    typeof colors.accent === "string" ? colors.accent : colors.accent.light,
    "accent",
  );
  const accentD = assertBrandColor(
    typeof colors.accent === "string" ? colors.accent : colors.accent.dark,
    "accent (dark)",
  );

  const decl: string[] = [
    `--cherry-l-accent-default: ${accentL};`,
    `--cherry-d-accent-default: ${accentD};`,
    `--cherry-l-accent-hover: ${mix(accentL, 85, "black")};`,
    `--cherry-d-accent-hover: ${mix(accentD, 85, "white")};`,
    `--cherry-l-accent-subtle: ${mix(accentL, 8, "white")};`,
    `--cherry-d-accent-subtle: ${mix(accentD, 16, "black")};`,
    `--cherry-l-accent-fg: ${mix(accentL, 80, "black")};`,
    `--cherry-d-accent-fg: ${mix(accentD, 70, "white")};`,
    `--cherry-l-accent-ring: ${mix(accentL, 25, "transparent")};`,
    `--cherry-d-accent-ring: ${mix(accentD, 30, "transparent")};`,
    `--cherry-l-ai-from: ${accentL};`,
    `--cherry-d-ai-from: ${accentD};`,
  ];
  if (colors.primary) {
    const pL = assertBrandColor(colors.primary.light, "primary");
    const pD = assertBrandColor(colors.primary.dark, "primary (dark)");
    decl.push(
      `--cherry-l-primary-default: ${pL};`,
      `--cherry-d-primary-default: ${pD};`,
      `--cherry-l-primary-hover: ${mix(pL, 85, "white")};`,
      `--cherry-d-primary-hover: ${mix(pD, 85, "black")};`,
    );
    if (colors.primary.fgLight)
      decl.push(
        `--cherry-l-primary-fg: ${assertBrandColor(colors.primary.fgLight, "primary fg")};`,
      );
    if (colors.primary.fgDark)
      decl.push(
        `--cherry-d-primary-fg: ${assertBrandColor(colors.primary.fgDark, "primary fg (dark)")};`,
      );
  }
  const css = `@layer cherry {\n  [data-cherry-brand="${name}"] {\n    ${decl.join("\n    ")}\n  }\n}\n`;
  return { name, css, attributes: { "data-cherry-brand": name } };
}
