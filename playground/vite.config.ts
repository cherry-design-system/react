import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Playground: renders the library from source, light / dark / brand scopes.
export default defineConfig({
  root: "playground",
  plugins: [react()],
  server: {
    port: 5180,
    host: "127.0.0.1",
    // Tailnet-only HTTPS proxy (tailscale serve); never widen to true.
    allowedHosts: [".taile7f725.ts.net"],
  },
  build: { outDir: "dist", emptyOutDir: true },
});
