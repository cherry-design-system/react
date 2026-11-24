// Server-safe (no "use client"): plain values for a layout <head> script and
// server code. Also exported as `@cherry-design-system/react/theme-init`.

export interface ThemeInitScriptOptions {
  /**
   * The `theme-color` meta for each mode, so browser chrome matches the page
   * from the first paint. Pass false to leave the meta alone. Defaults to
   * cherry's bg/canvas: #ffffff (light) and #09090b (dark).
   */
  themeColor?: { light: string; dark: string } | false;
}

// JSON keeps it a string literal; escaping "<" keeps "</script>" from closing the tag.
const literal = (value: string) =>
  JSON.stringify(value).replace(/</g, "\\u003c");

/**
 * A blocking script for <head> that puts the page in the visitor's mode
 * before the first paint (the `dark` class on <html>), with the same decision
 * as the color-mode store: a stored `themePreference` (light | dark | system),
 * else a cherry 1.x `theme` entry, else the OS; the `theme` cookie where
 * storage is blocked. Render it with dangerouslySetInnerHTML.
 */
export function createThemeInitScript(
  options: ThemeInitScriptOptions = {},
): string {
  const themeColor =
    options.themeColor === undefined
      ? { light: "#ffffff", dark: "#09090b" }
      : options.themeColor;
  const meta = themeColor
    ? `var g=document.querySelector('meta[name="theme-color"]:not([media])');if(!g){g=document.createElement("meta");g.name="theme-color";document.head.appendChild(g)}g.content=m==="dark"?${literal(themeColor.dark)}:${literal(themeColor.light)};`
    : "";
  return `(function(){try{var r=document.documentElement,o=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light",k=document.cookie.split(";").map(function(s){return s.trim()}).find(function(s){return s.indexOf("theme=")===0}),c=k?k.slice(6):null,m;try{var p=localStorage.getItem("themePreference"),t=localStorage.getItem("theme");m=p==="light"||p==="dark"?p:p!=="system"&&(t==="light"||t==="dark")?t:o}catch(e){m=c==="light"||c==="dark"?c:o}if(c!==m)document.cookie="theme="+m+";path=/;max-age=31536000;SameSite=Lax";r.classList.toggle("dark",m==="dark");${meta}}catch(e){}})();`;
}

/** createThemeInitScript() with cherry's default theme-color. */
export const themeInitScript = createThemeInitScript();

/** The mode a `theme` cookie names, for server code (light when unknown). */
export function modeFromCookie(
  cookieValue: string | undefined,
): "light" | "dark" {
  return cookieValue === "dark" ? "dark" : "light";
}
