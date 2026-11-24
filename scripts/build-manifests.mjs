// Reads src/components/*/manifest.json and emits, per component, the variant
// unions (variants.gen.ts) plus one src/style-api.json describing every
// component's classes, data attributes and allowed values. A diff of
// style-api.json between versions shows breaking style changes.
//
// manifest.json shape:
// { "name": "button", "class": "cherry-button",
//   "attributes": { "variant": ["primary", "secondary"], "size": ["sm", "md"] },
//   "states": ["disabled", "loading"] }
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const root = new URL("../src/components/", import.meta.url);
const api = {};
const pascal = (s) => s.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());

for (const dir of readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
  const file = new URL(`${dir}/manifest.json`, root);
  if (!existsSync(file)) continue;
  const m = JSON.parse(readFileSync(file));
  if (!m.name || !m.class) throw new Error(`${dir}/manifest.json needs "name" and "class"`);
  const comp = pascal(m.name);
  const attrs = m.attributes ?? {};
  let ts = `// Generated from manifest.json by scripts/build-manifests.mjs. Do not edit.\n`;
  for (const [attr, values] of Object.entries(attrs)) {
    const constName = `${m.name.replace(/-(\w)/g, (_, c) => c.toUpperCase())}${pascal(attr)}s`;
    ts += `export const ${constName} = ${JSON.stringify(values)} as const;\n`;
    ts += `export type ${comp}${pascal(attr)} = (typeof ${constName})[number];\n`;
  }
  writeFileSync(new URL(`${dir}/variants.gen.ts`, root), ts);
  api[m.name] = { class: m.class, attributes: Object.fromEntries(Object.entries(attrs).map(([k, v]) => [`data-${k}`, v])), states: m.states ?? [], parts: m.parts ?? [] };
}

writeFileSync(new URL("../src/style-api.json", import.meta.url), JSON.stringify(api, null, 2) + "\n");
console.log(`manifests: ${Object.keys(api).length} components`);
