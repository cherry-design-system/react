// Builds the token outputs from the DTCG sources in tokens/:
//   - src/styles/tokens.css   every token as a --cherry-* custom property
//   - src/tokens/tokens.gen.ts the token names as TS types and values
//
// Modes use the "space toggle" from cherry 0.3: --cherry-light / --cherry-dark
// are one `initial` and one empty, so `var(--cherry-light, A) var(--cherry-dark, B)`
// resolves to exactly one of A or B. Each semantic color has two slots
// (--cherry-l-* and --cherry-d-*) that brands override; the resolved token is
// redeclared on every scope (:root, .dark, [data-cherry-mode], [data-cherry-brand])
// so a nested scope recomputes it. We avoid light-dark(): lightningcss
// downlevels it in Vite 8 / Next 16 and breaks dark sections in light pages.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const read = (f) => JSON.parse(readFileSync(new URL(`../tokens/${f}`, import.meta.url)));
const primitives = read("primitives.tokens.json");
const light = read("color.light.tokens.json");
const dark = read("color.dark.tokens.json");
const base = read("base.tokens.json");
const typography = read("typography.tokens.json");

/** Flattens a DTCG tree to [["a/b", token], ...]. */
function flatten(tree, prefix = []) {
  const out = [];
  for (const [key, value] of Object.entries(tree)) {
    if (key.startsWith("$")) continue;
    if (value && typeof value === "object" && "$value" in value) out.push([[...prefix, key].join("/"), value]);
    else if (value && typeof value === "object") out.push(...flatten(value, [...prefix, key]));
  }
  return out;
}

const cssName = (path) => `--cherry-${path.replace(/\//g, "-")}`;
const refToVar = (value) => {
  const m = /^\{(.+)\}$/.exec(value);
  return m ? `var(${cssName(m[1].replace(/\./g, "/"))})` : value;
};
const dim = (v) => (typeof v === "object" ? `${v.value}${v.unit}` : String(v));

const lines = { root: [], resolved: [] };
const names = { color: [], space: [], radius: [], duration: [], easing: [], text: [], elevation: [], layout: [] };

// Primitives: plain values, no modes.
for (const [path, token] of flatten(primitives)) lines.root.push(`${cssName(path)}: ${token.$value};`);

// Semantic colors: paired slots + resolved token.
const lightMap = new Map(flatten(light));
const darkMap = new Map(flatten(dark));
for (const [path, token] of lightMap) {
  const d = darkMap.get(path);
  if (!d) throw new Error(`color.dark is missing ${path}`);
  const slug = path.replace(/\//g, "-");
  lines.root.push(`--cherry-l-${slug}: ${refToVar(token.$value)};`, `--cherry-d-${slug}: ${refToVar(d.$value)};`);
  lines.resolved.push(`--cherry-${slug}: var(--cherry-light, var(--cherry-l-${slug})) var(--cherry-dark, var(--cherry-d-${slug}));`);
  names.color.push(path);
}
for (const path of darkMap.keys()) if (!lightMap.has(path)) throw new Error(`color.light is missing ${path}`);

// Base: space, radius, duration, easing, layout.
for (const [path, token] of flatten(base)) {
  const [group] = path.split("/");
  let value;
  if (token.$type === "cubicBezier") value = `cubic-bezier(${token.$value.join(", ")})`;
  else value = dim(token.$value);
  lines.root.push(`${cssName(path)}: ${value};`);
  if (group in names) names[group].push(path.slice(group.length + 1));
  else names.layout.push(path);
}

// Typography: families + one shorthand set per text style.
for (const [path, token] of flatten(typography)) {
  if (token.$type === "fontFamily") {
    lines.root.push(`${cssName(path)}: ${token.$value.map((f) => (/\s/.test(f) ? `"${f}"` : f)).join(", ")};`);
    continue;
  }
  const v = token.$value;
  const slug = path.replace(/^text\//, "");
  const family = refToVar(v.fontFamily);
  lines.root.push(
    `--cherry-text-${slug}-size: ${dim(v.fontSize)};`,
    `--cherry-text-${slug}-line-height: ${v.lineHeight};`,
    `--cherry-text-${slug}-tracking: ${dim(v.letterSpacing)};`,
    `--cherry-text-${slug}-weight: ${v.fontWeight};`,
    `--cherry-text-${slug}-family: ${family};`,
  );
  names.text.push(slug);
}

// Elevation: composite shadows built on the mode-aware shadow colors, so they
// live with the resolved tokens and follow nested scopes. The inset highlight
// is transparent in light mode and a hairline of light in dark mode.
const elevation = {
  xs: ["0 1px 2px var(--cherry-shadow-xs)"],
  sm: ["0 1px 2px var(--cherry-shadow-ambient)", "0 2px 4px var(--cherry-shadow-sm)", "inset 0 1px 0 var(--cherry-shadow-highlight)"],
  md: ["0 1px 3px var(--cherry-shadow-ambient)", "0 6px 12px var(--cherry-shadow-md)", "inset 0 1px 0 var(--cherry-shadow-highlight)"],
  lg: ["0 2px 4px var(--cherry-shadow-ambient)", "0 12px 24px var(--cherry-shadow-lg)", "inset 0 1px 0 var(--cherry-shadow-highlight)"],
  xl: ["0 4px 8px var(--cherry-shadow-ambient)", "0 24px 48px var(--cherry-shadow-xl)", "inset 0 1px 0 var(--cherry-shadow-highlight)"],
};
for (const [k, parts] of Object.entries(elevation)) {
  lines.resolved.push(`--cherry-elevation-${k}: ${parts.join(", ")};`);
  names.elevation.push(k);
}
lines.resolved.push(
  "--cherry-ring: 0 0 0 3px var(--cherry-focus-ring);",
  "--cherry-ring-danger: 0 0 0 3px var(--cherry-accent-ring);",
);

const scopes = ':root, .dark, [data-cherry-mode], [data-cherry-brand]';
const indent = (arr) => arr.map((l) => `    ${l}`).join("\n");
const css = `/* Generated by scripts/build-tokens.mjs from tokens/*.tokens.json. Do not edit. */
@layer cherry {
  :where(:root) {
    --cherry-light: initial;
    --cherry-dark: ;
    color-scheme: light;
${indent(lines.root)}
  }

  :where(.dark, [data-cherry-mode="dark"]) {
    --cherry-light: ;
    --cherry-dark: initial;
    color-scheme: dark;
  }

  :where([data-cherry-mode="light"]) {
    --cherry-light: initial;
    --cherry-dark: ;
    color-scheme: light;
  }

  :where(${scopes}) {
${indent(lines.resolved)}
  }
}
`;
mkdirSync(new URL("../src/styles", import.meta.url), { recursive: true });
writeFileSync(new URL("../src/styles/tokens.css", import.meta.url), css);

const union = (arr) => (arr.length ? arr.map((n) => JSON.stringify(n)).join(" | ") : "never");
const ts = `// Generated by scripts/build-tokens.mjs. Do not edit.
export const colorTokens = ${JSON.stringify(names.color)} as const;
export const textStyles = ${JSON.stringify(names.text)} as const;
export const spaceTokens = ${JSON.stringify(names.space)} as const;
export const radiusTokens = ${JSON.stringify(names.radius)} as const;
export const elevationTokens = ${JSON.stringify(names.elevation)} as const;

export type ColorToken = ${union(names.color)};
export type TextStyle = ${union(names.text)};
export type SpaceToken = ${union(names.space)};
export type RadiusToken = ${union(names.radius)};
export type ElevationToken = ${union(names.elevation)};
`;
mkdirSync(new URL("../src/tokens", import.meta.url), { recursive: true });
writeFileSync(new URL("../src/tokens/tokens.gen.ts", import.meta.url), ts);

console.log(`tokens: ${names.color.length} colors, ${names.text.length} text styles, ${names.space.length} space, ${names.radius.length} radius, ${names.elevation.length} elevation`);
