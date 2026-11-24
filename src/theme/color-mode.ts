// The light/dark mode, outside React.
//
// The mode is the `dark` class on <html>: every color is a CSS variable that
// follows it, so switching re-renders nothing. What the visitor picked lives
// in this small store (read with useSyncExternalStore by useColorMode), and
// the inline init script (theme-init.ts) makes the same decision before the
// first paint, so hydration never flips the mode:
//
//   1. an explicit `themePreference` in localStorage: light, dark or system;
//   2. else a `theme` entry in localStorage (written by cherry 1.x);
//   3. else the OS ("system"), followed live.
//
// Where storage is blocked, the `theme` cookie keeps the choice. The cookie
// always mirrors the mode in force, for server code that wants it.

export type ColorMode = "light" | "dark";
export type ColorModePreference = ColorMode | "system";

export interface ColorModeState {
  /** The mode in force. */
  mode: ColorMode;
  /** What the visitor picked: a fixed mode, or whatever the OS is set to. */
  preference: ColorModePreference;
}

const PREFERENCE_KEY = "themePreference";
export const DARK_MODE_QUERY = "(prefers-color-scheme: dark)";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const isBrowser = () =>
  typeof window !== "undefined" && typeof document !== "undefined";

function systemMode(): ColorMode {
  return isBrowser() && window.matchMedia?.(DARK_MODE_QUERY).matches
    ? "dark"
    : "light";
}

function resolveMode(preference: ColorModePreference): ColorMode {
  return preference === "system" ? systemMode() : preference;
}

function readCookieMode(): ColorMode | undefined {
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("theme="));
  const value = entry?.slice("theme=".length);
  return value === "dark" || value === "light" ? value : undefined;
}

function readPreference(): ColorModePreference {
  try {
    const stored = window.localStorage.getItem(PREFERENCE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system")
      return stored;
    const legacy = window.localStorage.getItem("theme");
    return legacy === "light" || legacy === "dark" ? legacy : "system";
  } catch {
    return readCookieMode() ?? "system";
  }
}

function storePreference(preference: ColorModePreference) {
  try {
    window.localStorage.setItem(PREFERENCE_KEY, preference);
  } catch {
    // Storage is blocked: the cookie applyColorMode writes keeps the choice.
  }
}

const SERVER_STATE: ColorModeState = { mode: "light", preference: "system" };
let state: ColorModeState | null = null;
const listeners = new Set<() => void>();
let mediaInstalled = false;

/** The visitor's mode and preference. On the server: light / system. */
export function getColorModeState(): ColorModeState {
  if (!isBrowser()) return SERVER_STATE;
  if (!state) {
    const preference = readPreference();
    state = { mode: resolveMode(preference), preference };
  }
  return state;
}

/** Server snapshot for useSyncExternalStore. */
export function getServerColorModeState(): ColorModeState {
  return SERVER_STATE;
}

function installSystemListener() {
  if (mediaInstalled || !isBrowser() || !window.matchMedia) return;
  mediaInstalled = true;
  window.matchMedia(DARK_MODE_QUERY).addEventListener("change", () => {
    const current = getColorModeState();
    if (current.preference === "system")
      update({ mode: systemMode(), preference: "system" });
  });
}

export function subscribeColorMode(listener: () => void) {
  installSystemListener();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function update(next: ColorModeState) {
  const current = getColorModeState();
  if (current.mode === next.mode && current.preference === next.preference)
    return;
  state = next;
  applyColorMode(next.mode);
  listeners.forEach((listener) => listener());
}

/** Picks a mode, or "system" to follow the OS, and remembers it. */
export function setColorModePreference(preference: ColorModePreference) {
  // Read the current state before storing, or the first call would compare
  // the new preference with itself and skip applying it.
  getColorModeState();
  storePreference(preference);
  update({ mode: resolveMode(preference), preference });
}

/** Switches to the other mode and remembers it. */
export function toggleColorMode() {
  setColorModePreference(
    getColorModeState().mode === "dark" ? "light" : "dark",
  );
}

let switchId = 0;

/**
 * Puts the page in `mode`: the `dark` class on <html> (painted with
 * transitions off for that frame via `.theme-switching`), the `theme` cookie,
 * and the theme-color meta from the resolved --cherry-bg-canvas token.
 * Writes only what differs.
 */
export function applyColorMode(
  mode: ColorMode,
  { persist = true }: { persist?: boolean } = {},
) {
  if (!isBrowser()) return;
  const root = document.documentElement;
  const dark = mode === "dark";
  if (root.classList.contains("dark") !== dark) {
    const id = ++switchId;
    root.classList.add("theme-switching");
    root.classList.toggle("dark", dark);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (id === switchId) root.classList.remove("theme-switching");
      }),
    );
  }
  if (persist && readCookieMode() !== mode) {
    document.cookie = `theme=${mode};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
  }
  const color = getComputedStyle(root)
    .getPropertyValue("--cherry-bg-canvas")
    .trim();
  if (!color) return;
  let meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]:not([media])',
  );
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  if (meta.content !== color) meta.content = color;
}

/** Test helper: forget the cached state (not exported from the package). */
export function __resetColorModeForTests() {
  state = null;
  listeners.clear();
  mediaInstalled = false;
}
