import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Library build: one ESM file per source module (tree-shakeable, keeps
// "use client" scoped to the interactive modules). Declarations come from
// `tsc -p tsconfig.build.json`; CSS is copied by scripts/build-css.mjs.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        "tokens/index": "src/tokens/index.ts",
        "theme/theme-init": "src/theme/theme-init.ts",
      },
      formats: ["es"],
    },
    rolldownOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/, /^lucide-react($|\/)/],
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
      },
    },
    sourcemap: true,
    emptyOutDir: true,
    copyPublicDir: false,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
