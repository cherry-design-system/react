// Generates skills/cherry-react/references/components.md, the agent
// skill's component reference, from the source so it cannot drift:
//   - components and their props (types, defaults, descriptions) come from the
//     TypeScript exports of src/components/*/index.ts and their JSDoc;
//   - category, accessibility notes and the example come from each
//     component's manifest.json ("category", "accessibility", "example").
// CI fails when the committed file differs from a fresh run.
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript-v5";

const root = fileURLToPath(new URL("..", import.meta.url));
const compDir = `${root}src/components`;
const out = `${root}skills/cherry-react/references/components.md`;

const CATEGORIES = [
  "Actions",
  "Forms",
  "Pickers",
  "Navigation",
  "Overlays",
  "Feedback",
  "Data display",
  "Content",
  "Layout",
  "Chat",
];

const dirs = readdirSync(compDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(`${compDir}/${d.name}/index.ts`))
  .map((d) => d.name)
  .sort();

const program = ts.createProgram(
  dirs.map((d) => `${compDir}/${d}/index.ts`),
  {
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
  },
);
const checker = program.getTypeChecker();

const doc = (symbol) =>
  ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();

const isOwn = (decl) => {
  const file = decl.getSourceFile().fileName;
  return file.startsWith(`${root}src/`);
};

const typeText = (type, node) => {
  const parts = type.isUnion() ? type.types : [type];
  const kept = parts.filter(
    (t) =>
      !(t.flags & ts.TypeFlags.Undefined) && !(t.flags & ts.TypeFlags.Null),
  );
  if (kept.length && kept.every((t) => t.isStringLiteral()))
    return kept.map((t) => `"${t.value}"`).join(" | ");
  if (
    kept.length === 2 &&
    kept.every((t) => t.flags & ts.TypeFlags.BooleanLiteral)
  )
    return "boolean";
  // Prefer the written annotation (short and readable) over the expansion.
  const written = node?.type?.getText();
  const text =
    written ??
    checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation);
  return text.replace(/\s+/g, " ");
};

/** Props declared by cherry (not inherited from React/DOM typings). */
function ownProps(propsType) {
  const rows = [];
  for (const prop of checker.getPropertiesOfType(propsType)) {
    const decls = (prop.declarations ?? []).filter(isOwn);
    if (!decls.length) continue;
    const decl = decls[0];
    const type = checker.getTypeOfSymbolAtLocation(prop, decl);
    const description = doc(prop).replace(/\s+/g, " ");
    const optional = !!(prop.flags & ts.SymbolFlags.Optional);
    const def = description.match(/Defaults? to ([^.;]+?)(?:\.|;|$)/i)?.[1];
    const plain = def
      ? description.replace(/\s*Defaults? to [^.;]+?(?:\.|;|$)/i, "").trim()
      : description;
    rows.push({
      name: prop.name,
      type: typeText(type, decl),
      optional,
      description: plain,
      def,
    });
  }
  return rows.sort((a, b) => Number(a.optional) - Number(b.optional));
}

/** The host element a props type extends, e.g. "<button>". */
function inherits(propsSymbol) {
  const decl = propsSymbol.declarations?.[0];
  const text = decl?.getText() ?? "";
  const m = text.match(
    /(\w+)HTMLAttributes<HTML(\w*?)Element>|HTMLAttributes<HTML(\w*?)Element>/,
  );
  if (!m) return null;
  const el = (m[2] ?? m[3] ?? "").toLowerCase();
  const map = {
    "": "element",
    anchor: "a",
    paragraph: "p",
    heading: "h*",
    olist: "ol",
    ulist: "ul",
    tablecell: "td",
  };
  return map[el] ?? el;
}

const sections = new Map(CATEGORIES.map((c) => [c, []]));
const missing = [];

for (const dir of dirs) {
  const manifest = JSON.parse(
    readFileSync(`${compDir}/${dir}/manifest.json`, "utf8"),
  );
  const sf = program.getSourceFile(`${compDir}/${dir}/index.ts`);
  const mod = checker.getSymbolAtLocation(sf);
  const exports = mod ? checker.getExportsOfModule(mod) : [];
  const byName = new Map(exports.map((s) => [s.name, s]));
  const components = exports
    .filter((s) => /^[A-Z]/.test(s.name) && byName.has(`${s.name}Props`))
    .map((s) => {
      const target =
        s.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(s) : s;
      if (!(target.flags & (ts.SymbolFlags.Variable | ts.SymbolFlags.Function)))
        return null;
      const propsSym = byName.get(`${s.name}Props`);
      const propsTarget =
        propsSym.flags & ts.SymbolFlags.Alias
          ? checker.getAliasedSymbol(propsSym)
          : propsSym;
      const propsType = checker.getDeclaredTypeOfSymbol(propsTarget);
      return {
        name: s.name,
        description: doc(target)
          .replace(/\n(?!\n)/g, " ")
          .replace(/ {2,}/g, " "),
        props: ownProps(propsType),
        host: inherits(propsTarget),
      };
    })
    .filter(Boolean);

  // Other runtime exports: hooks, providers and helpers (not the value
  // arrays like buttonSizes, which the props tables already list).
  const listed = new Set(components.map((c) => c.name));
  const extras = exports
    .filter((s) => !listed.has(s.name) && !/Props$/.test(s.name))
    .map((s) =>
      s.flags & ts.SymbolFlags.Alias
        ? [s, checker.getAliasedSymbol(s)]
        : [s, s],
    )
    .filter(
      ([, t]) =>
        t.flags & ts.SymbolFlags.Function ||
        (t.flags & ts.SymbolFlags.Variable &&
          checker.getTypeOfSymbol(t).getCallSignatures().length),
    )
    .map(([s, t]) => ({
      name: s.name,
      description: doc(t).split(/\n\n/)[0].replace(/\s+/g, " "),
    }));
  const client = components.some((c) => {
    const sym = byName.get(c.name);
    const t =
      sym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(sym) : sym;
    const text = t.declarations?.[0]?.getSourceFile().text ?? "";
    return /^\s*["']use client["']/.test(text);
  });

  const category = manifest.category;
  if (!category || !sections.has(category)) missing.push(`${dir}: category`);
  if (!manifest.accessibility) missing.push(`${dir}: accessibility`);
  if (!manifest.example) missing.push(`${dir}: example`);
  (sections.get(category) ?? sections.get("Content")).push({
    dir,
    manifest,
    components,
    extras,
    client,
  });
}

if (missing.length) {
  console.error(
    `build-skill: manifest fields missing:\n  ${missing.join("\n  ")}`,
  );
  process.exit(1);
}

// Type-check every example against the real components: unknown lowercase
// names (handlers, state) are allowed, wrong props/values/icons are not.
function checkExamples(entries) {
  const exportNames = new Set();
  for (const dir of dirs) {
    const sf = program.getSourceFile(`${compDir}/${dir}/index.ts`);
    const mod = checker.getSymbolAtLocation(sf);
    for (const s of mod ? checker.getExportsOfModule(mod) : [])
      exportNames.add(s.name);
  }
  const files = new Map();
  for (const { dir, manifest } of entries) {
    const code = manifest.example;
    const used = new Set(code.match(/\b[A-Z][A-Za-z0-9]*\b/g) ?? []);
    const cherry = [...used].filter((n) => exportNames.has(n));
    const icons = [...used].filter(
      (n) =>
        !exportNames.has(n) &&
        /^</.test("<") &&
        new RegExp(`<${n}\\b`).test(code),
    );
    const statements = /^\s*(const |let |\/\/)/m.test(code);
    const body = statements ? code : `return (\n<>\n${code}\n</>\n);`;
    const src = [
      `import { ${cherry.join(", ")} } from "../src/index";`,
      icons.length ? `import { ${icons.join(", ")} } from "lucide-react";` : "",
      `export function Example() {`,
      body,
      `}`,
    ].join("\n");
    files.set(`${root}.skill-examples/${dir}.tsx`, src);
  }
  const options = {
    ...program.getCompilerOptions(),
    noEmit: true,
    noUnusedLocals: false,
  };
  const host = ts.createCompilerHost(options);
  const { fileExists, readFile, getSourceFile } = host;
  host.fileExists = (f) => files.has(f) || fileExists.call(host, f);
  host.readFile = (f) => files.get(f) ?? readFile.call(host, f);
  host.getSourceFile = (f, lang, ...rest) =>
    files.has(f)
      ? ts.createSourceFile(f, files.get(f), lang, true, ts.ScriptKind.TSX)
      : getSourceFile.call(host, f, lang, ...rest);
  const exProgram = ts.createProgram([...files.keys()], options, host);
  // 2304/2552: cannot find name (placeholder handlers and data in examples).
  const allowed = new Set([2304, 2552, 2582, 7006, 7031]);
  const errors = ts
    .getPreEmitDiagnostics(exProgram)
    .filter((d) => d.file && files.has(d.file.fileName) && !allowed.has(d.code))
    .map((d) => {
      const dir = d.file.fileName.split("/").pop().replace(".tsx", "");
      return `${dir}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`;
    });
  if (errors.length) {
    console.error(
      `build-skill: examples do not type-check:\n  ${errors.join("\n  ")}`,
    );
    process.exit(1);
  }
}

checkExamples([...sections.values()].flat());

// Prose may mention elements (<button>, <ToastProvider>): code-format them
// so markdown renderers don't swallow them as HTML.
const tags = (s) =>
  s.replace(/(^|[^`])<(\/?[A-Za-z][\w.]*(?:\s[^<>]*)?\/?)>(?!`)/g, "$1`<$2>`");
const cell = (s) => tags(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
let md = `<!-- Generated by scripts/build-skill.mjs from the component source and manifests. Do not edit by hand. -->

# Component reference

Every component is exported from \`@cherry-design-system/react\` and styled by \`@cherry-design-system/react/styles.css\` (import it once). Props below are the ones cherry adds; each component also accepts the attributes of the element it renders (listed as "plus all \`<el>\` attributes") and forwards its ref. Allowed values are exact: a value outside the list renders unstyled.

`;
md += CATEGORIES.map(
  (c) =>
    `- [${c}](#${c.toLowerCase().replace(/\s+/g, "-")}): ${sections
      .get(c)
      .flatMap((e) => e.components.map((x) => x.name))
      .join(", ")}`,
).join("\n");
md += "\n";

for (const [category, entries] of sections) {
  if (!entries.length) continue;
  md += `\n## ${category}\n`;
  for (const { manifest, components, extras, client } of entries) {
    const title = components.map((c) => c.name).join(", ");
    md += `\n### ${title}\n\n`;
    md += client
      ? '_Client component (`"use client"`): import it from a Server Component freely; it hydrates on the client._\n\n'
      : "_Server Component safe: no client JavaScript._\n\n";
    for (const c of components) {
      if (components.length > 1) md += `**${c.name}**: `;
      md += `${tags(c.description || "(no description)")}\n\n`;
      if (c.props.length) {
        md +=
          "| Prop | Type | Default | Description |\n| --- | --- | --- | --- |\n";
        for (const p of c.props)
          md += `| \`${p.name}\`${p.optional ? "" : " (required)"} | \`${p.type.replace(/\|/g, "\\|")}\` | ${p.def ? cell(p.def) : ""} | ${cell(p.description)} |\n`;
        md += "\n";
      }
      if (c.host) md += `Plus all \`<${c.host}>\` attributes.\n\n`;
    }
    if (extras.length)
      md += `Also exported: ${extras.map((e) => `\`${e.name}\`${e.description ? ` (${tags(e.description.replace(/\.$/, ""))})` : ""}`).join("; ")}.\n\n`;
    md += `**Accessibility:** ${tags(manifest.accessibility)}\n\n`;
    md += "```tsx\n" + manifest.example.trim() + "\n```\n";
  }
}

// ---- tokens.md -------------------------------------------------------------
const tokensOut = `${root}skills/cherry-react/references/tokens.md`;
const readJson = (f) => JSON.parse(readFileSync(`${root}tokens/${f}`, "utf8"));
const flat = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    k.startsWith("$")
      ? []
      : v && typeof v === "object" && "$value" in v
        ? [[prefix + k, v]]
        : v && typeof v === "object"
          ? flat(v, `${prefix}${k}.`)
          : [],
  );
const light = Object.fromEntries(flat(readJson("color.light.tokens.json")));
const dark = Object.fromEntries(flat(readJson("color.dark.tokens.json")));
const css = readFileSync(`${root}src/styles/tokens.css`, "utf8");
const resolved = [...css.matchAll(/^\s+(--cherry-[a-z0-9-]+):\s*([^;]+);/gm)]
  .filter(([, n]) => !/^--cherry-(l|d)-/.test(n))
  .map(([, n, v]) => [n, v.trim()]);
const val = (n) => resolved.find(([k]) => k === n)?.[1];
const NOTES = {
  "fg.default": "Body text and headings.",
  "fg.muted":
    "Secondary text, placeholders, hints, captions. At least 4.5:1 on canvas, subtle and muted backgrounds.",
  "fg.subtle":
    "Disabled text, borders and decorative marks only: below 4.5:1, never for readable text.",
  "border.focus": "Focus border, paired with --cherry-ring.",
  "focus.ring": "The soft ring color inside --cherry-ring.",
  "accent.default": "Brand accent fill (white text on it is at least 4.5:1).",
  "accent.fg": "Accent-colored text on canvas.",
};
const ref = (v) => String(v?.$value ?? "").replace(/[{}]/g, "");
let tmd = `<!-- Generated by scripts/build-skill.mjs from tokens/*.tokens.json and src/styles/tokens.css. Do not edit by hand. -->

# Tokens

Every value is a CSS custom property on \`:root\` (and on any \`[data-cherry-mode]\` / \`[data-cherry-brand]\` scope). Use them in your own CSS instead of hardcoded values; colors switch between light and dark by themselves, so never branch on the mode.

\`\`\`css
.my-panel {
  padding: var(--cherry-space-4);
  border: 1px solid var(--cherry-border-default);
  border-radius: var(--cherry-radius-lg);
  background: var(--cherry-bg-elevated);
  color: var(--cherry-fg-default);
  box-shadow: var(--cherry-elevation-sm);
}
.my-panel:focus-visible {
  outline: 2px solid transparent; /* stays visible in Windows High Contrast */
  box-shadow: var(--cherry-ring);
}
\`\`\`

## Color

Semantic colors. Light and dark show the palette step each one points to.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
`;
for (const [name, l] of Object.entries(light)) {
  const note = NOTES[name] ?? l.$description ?? "";
  tmd += `| \`--cherry-${name.replace(/\./g, "-")}\` | ${ref(l)} | ${ref(dark[name])} | ${note.replace(/\|/g, "\\|")} |\n`;
}
const group = (
  title,
  intro,
  re,
  fmt = (n, v) => `| \`${n}\` | \`${v.replace(/\|/g, "\\|")}\` |`,
) => {
  const rows = resolved.filter(([n]) => re.test(n));
  if (!rows.length) return "";
  return `\n## ${title}\n\n${intro}\n\n| Token | Value |\n| --- | --- |\n${rows.map(([n, v]) => fmt(n, v)).join("\n")}\n`;
};
tmd += group(
  "Spacing",
  "4px base scale. Layout props (`gap`, `padding`) take the step number, e.g. `gap={4}` is `--cherry-space-4`.",
  /^--cherry-space-/,
);
tmd += group("Radius", "", /^--cherry-radius-/);
tmd += group(
  "Elevation and focus",
  "`--cherry-ring` is the focus ring for most controls; `--cherry-ring-inset` draws it inward for controls inside a scrolling or clipping container.",
  /^--cherry-(elevation|ring)/,
);
tmd += group(
  "Motion",
  "Every cherry transition uses these; under `prefers-reduced-motion: reduce` the durations drop to 1ms.",
  /^--cherry-(duration|easing)-/,
);
tmd += group("Layout", "", /^--cherry-(breakpoint|container|gutter|padding)-/);
const styles = [
  ...new Set(
    resolved
      .map(([n]) => n.match(/^--cherry-text-(.+)-size$/)?.[1])
      .filter(Boolean),
  ),
];
tmd += `\n## Typography\n\nEach text style is a set of \`--cherry-text-<style>-size\`, \`-line-height\`, \`-weight\`, \`-tracking\` and \`-family\`. Fonts: \`--cherry-font-sans\` (Geist) and \`--cherry-font-mono\` (Geist Mono).\n\n| Style | Size | Line height | Weight |\n| --- | --- | --- | --- |\n`;
for (const st of styles)
  tmd += `| \`${st}\` | ${val(`--cherry-text-${st}-size`) ?? ""} | ${val(`--cherry-text-${st}-line-height`) ?? ""} | ${val(`--cherry-text-${st}-weight`) ?? ""} |\n`;

const check = process.argv.includes("--check");
for (const [file, content] of [
  [out, md],
  [tokensOut, tmd],
]) {
  if (check) {
    const current = existsSync(file) ? readFileSync(file, "utf8") : "";
    if (current !== content) {
      console.error(
        `build-skill: ${file.replace(root, "")} is out of date; run pnpm generate`,
      );
      process.exit(1);
    }
  } else writeFileSync(file, content);
}
console.log(
  `skill: ${[...sections.values()].flat().reduce((n, e) => n + e.components.length, 0)} components in ${dirs.length} folders`,
);
