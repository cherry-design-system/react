// Same decision as the inline script a real app puts in <head>. A preview
// with ?theme= just takes that mode and stores nothing.
import { themeInitScript } from "../../src/theme/theme-init";
import { previewTheme } from "./preview";

if (previewTheme) {
  document.documentElement.classList.toggle("dark", previewTheme === "dark");
} else {
  new Function(themeInitScript)();
}
