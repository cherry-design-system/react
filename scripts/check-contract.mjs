// Contract check (CI). Fails when:
//   1. a CSS rule sits outside `@layer cherry`;
//   2. a stylesheet uses !important (except the .theme-switching guard in base.css);
//   3. a manifest attribute value has no selector in its component CSS
//      (e.g. variant "ghost" without [data-variant="ghost"]);
//   4. a component CSS file does not use its manifest class.
import { readdirSync, readFileSync, existsSync } from "node:fs";

const errors = [];
const styles = new URL("../src/styles/", import.meta.url);

function checkLayer(file, css) {
  // Strip comments, then walk top-level blocks.
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let depth = 0;
  let header = "";
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch === "{") {
      if (depth === 0 && !/^\s*@layer\s+cherry\b/.test(header) && !/^\s*@layer\s+cherry\s*;?\s*$/.test(header)) {
        errors.push(`${file}: top-level block outside @layer cherry: "${header.trim().slice(0, 60)}"`);
      }
      depth++;
      header = "";
    } else if (ch === "}") {
      depth--;
      header = "";
    } else if (ch === ";" && depth === 0) {
      header = "";
    } else if (depth === 0) header += ch;
  }
}

function checkImportant(file, css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const count = (clean.match(/!important/g) || []).length;
  const allowed = file === "base.css" ? 1 : 0;
  if (count > allowed) errors.push(`${file}: ${count} !important (allowed ${allowed})`);
}

for (const f of ["tokens.css", "base.css"]) {
  const css = readFileSync(new URL(f, styles), "utf8");
  checkLayer(f, css);
  checkImportant(f, css);
}

const compDir = new URL("../src/components/", import.meta.url);
for (const dir of readdirSync(compDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
  const mf = new URL(`${dir}/manifest.json`, compDir);
  if (!existsSync(mf)) continue;
  const m = JSON.parse(readFileSync(mf));
  const cssFile = new URL(`components/${m.name}.css`, styles);
  if (!existsSync(cssFile)) {
    errors.push(`${m.name}: missing src/styles/components/${m.name}.css`);
    continue;
  }
  const css = readFileSync(cssFile, "utf8");
  checkLayer(`components/${m.name}.css`, css);
  checkImportant(`components/${m.name}.css`, css);
  if (!css.includes(`.${m.class}`)) errors.push(`${m.name}: CSS never uses .${m.class}`);
  for (const [attr, values] of Object.entries(m.attributes ?? {})) {
    for (const v of values) {
      if (m.defaults && m.defaults[attr] === v && !(m.requireDefaultSelector ?? false)) continue;
      const sel = `[data-${attr}="${v}"]`;
      if (!css.includes(sel)) errors.push(`${m.name}: no selector for ${sel}`);
    }
  }
}

if (errors.length) {
  console.error(`contract: ${errors.length} problem(s)\n` + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}
console.log("contract: ok");
