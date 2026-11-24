import { defineConfig, devices } from "@playwright/test";

// Accessibility checks against the built playground (e2e/*.e2e.ts). Motion is
// reduced so screenshots and focus checks never sample a half-run transition.
const PORT = 4180;

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    reducedMotion: "reduce",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm playground:build && pnpm exec vite preview --config playground/vite.config.ts --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
