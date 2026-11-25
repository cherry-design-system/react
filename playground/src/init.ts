// Same decision as the inline script a real app puts in <head>. A preview
// with ?theme= just takes that mode and stores nothing.
import { themeInitScript } from "../../src/theme/theme-init";
import { previewTheme } from "./preview";

if (previewTheme) {
  document.documentElement.classList.toggle("dark", previewTheme === "dark");
  sandboxColorMode(previewTheme);
} else {
  new Function(themeInitScript)();
}

/**
 * A pinned preview keeps the color-mode store in memory: the store reads
 * the pinned mode as the saved preference (so a ThemeToggle shows it
 * selected), and choosing another mode switches this page only. Nothing
 * reaches the site's real localStorage or cookies, so an embed never changes
 * how v2.cherry.al opens and a light and a dark iframe never flip each other.
 */
function sandboxColorMode(mode: "light" | "dark") {
  const items = new Map<string, string>([["themePreference", mode]]);
  const storage: Storage = {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, String(value)),
  };
  let cookie = `theme=${mode}`;
  Object.defineProperty(window, "localStorage", { value: storage });
  Object.defineProperty(document, "cookie", {
    get: () => cookie,
    // Keep only the name=value pair; drop path, max-age and the rest.
    set: (value: string) => {
      const pair = String(value).split(";")[0]?.trim();
      if (pair?.startsWith("theme=")) cookie = pair;
    },
  });
}
