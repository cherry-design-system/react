// Copies the static stylesheets to dist/css/ and concatenates them into
// dist/styles.css (tokens, base, then components A-Z). Also ships
// style-api.json. JS never imports CSS: apps import styles.css once, or the
// per-component files they use.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";

const src = new URL("../src/styles/", import.meta.url);
const out = new URL("../dist/css/", import.meta.url);
mkdirSync(out, { recursive: true });

const parts = ["tokens.css", "base.css"];
const components = readdirSync(new URL("components/", src)).filter((f) => f.endsWith(".css")).sort();

let bundle = "/* @cherry-design-system/react: tokens, base and every component. */\n@layer cherry;\n";
for (const f of parts) {
  copyFileSync(new URL(f, src), new URL(f, out));
  bundle += `\n/* ${f} */\n` + readFileSync(new URL(f, src), "utf8");
}
for (const f of components) {
  copyFileSync(new URL(`components/${f}`, src), new URL(f, out));
  bundle += `\n/* ${f} */\n` + readFileSync(new URL(`components/${f}`, src), "utf8");
}
writeFileSync(new URL("../dist/styles.css", import.meta.url), bundle);
copyFileSync(new URL("../src/style-api.json", import.meta.url), new URL("../dist/style-api.json", import.meta.url));
console.log(`css: ${parts.length + components.length} files, bundle ${(bundle.length / 1024).toFixed(1)} KB`);
