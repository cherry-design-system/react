import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Extra hostnames the dev server answers to (for example a tailnet HTTPS
// proxy), from PLAYGROUND_ALLOWED_HOSTS in a gitignored .env.local at the
// repo root: comma-separated, a leading dot allows subdomains. Only explicit
// hostnames are accepted; the server never allows every host.
function allowedHosts(mode: string): string[] {
  const raw = loadEnv(
    mode,
    process.cwd(),
    "PLAYGROUND_",
  ).PLAYGROUND_ALLOWED_HOSTS;
  return (raw ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter((host) => /^\.?[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(host));
}

// Playground: renders the library from source, light / dark / brand scopes.
export default defineConfig(({ mode }) => ({
  root: "playground",
  plugins: [react()],
  server: {
    port: 5180,
    host: "127.0.0.1",
    allowedHosts: allowedHosts(mode),
  },
  build: { outDir: "dist", emptyOutDir: true },
}));
