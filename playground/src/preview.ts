// Preview routes, for embeds (docs iframes) and screenshots:
//   /preview             index of every component demo
//   /preview/<id>        one playground section, centered in #preview-box
// Query parameters (previews only):
//   ?theme=dark|light    pin the mode for this document; nothing is stored,
//                        so a light and a dark iframe side by side never
//                        flip each other
//   ?accent=<color>      brand accent, e.g. ?accent=%23be123c. It goes
//                        through createBrand(), which rejects anything that
//                        is not a plain color, so the URL cannot inject CSS.
import { createBrand } from "../../src/theme/brand";

const match = window.location.pathname.match(/^\/preview(?:\/([\w-]*))?\/?$/);
const params = new URLSearchParams(window.location.search);

/** null outside /preview; "" on the index; the section id otherwise. */
export const previewName: string | null = match ? (match[1] ?? "") : null;

const theme = params.get("theme");
export const previewTheme: "light" | "dark" | null =
  previewName !== null && (theme === "light" || theme === "dark")
    ? theme
    : null;

/** Query string to carry onto preview links (theme and accent). */
export const previewQuery = (() => {
  if (previewName === null) return "";
  const keep = new URLSearchParams();
  for (const key of ["theme", "accent"]) {
    const value = params.get(key);
    if (value) keep.set(key, value);
  }
  const query = keep.toString();
  return query ? `?${query}` : "";
})();

/** Applies ?accent= as a brand on <body>; ignores invalid colors. */
export function applyPreviewAccent() {
  const accent = params.get("accent");
  if (previewName === null || !accent) return;
  try {
    const brand = createBrand("preview", { accent });
    const style = document.createElement("style");
    style.textContent = brand.css;
    document.head.appendChild(style);
    for (const [name, value] of Object.entries(brand.attributes))
      document.body.setAttribute(name, String(value));
  } catch {
    console.warn("Ignoring invalid ?accent= color");
  }
}

/** The id a playground Section gets from its title. */
export const sectionId = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
