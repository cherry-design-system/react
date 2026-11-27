"use client";
import { useEffect, useMemo, useState } from "react";
import { toggleColorMode } from "./color-mode";

export interface ColorModeShortcutOptions {
  /** Turns the shortcut off without unmounting. Defaults to true. */
  enabled?: boolean;
}

export interface ColorModeShortcut {
  /** For the `aria-keyshortcuts` attribute, e.g. "Meta+Shift+L". */
  ariaKeyShortcuts: string;
  /** For display (a Kbd, a tooltip), e.g. "⌘⇧L" on Apple, "Ctrl+Shift+L" elsewhere. */
  label: string;
}

interface Spec {
  mod: boolean;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
  key: string;
}

const MODIFIERS: Record<string, keyof Omit<Spec, "key">> = {
  mod: "mod",
  ctrl: "ctrl",
  control: "ctrl",
  meta: "meta",
  cmd: "meta",
  command: "meta",
  alt: "alt",
  option: "alt",
  shift: "shift",
};

/**
 * Parses "mod+shift+l" style keys. `mod` is ⌘ on Apple platforms and Ctrl
 * elsewhere. A shortcut must hold Ctrl, ⌘ or Alt: a bare (or Shift-only)
 * character key would fire while people type and fails WCAG 2.1.4.
 */
function parse(keys: string): Spec {
  const parts = keys
    .toLowerCase()
    .split("+")
    .map((part) => part.trim());
  const key = parts.pop();
  const spec: Spec = {
    mod: false,
    ctrl: false,
    meta: false,
    alt: false,
    shift: false,
    key: key ?? "",
  };
  for (const part of parts) {
    const modifier = MODIFIERS[part];
    if (!modifier)
      throw new TypeError(
        `useColorModeShortcut: unknown modifier "${part}" in "${keys}". Use mod, ctrl, meta, alt or shift.`,
      );
    spec[modifier] = true;
  }
  if (!spec.key || MODIFIERS[spec.key])
    throw new TypeError(
      `useColorModeShortcut: "${keys}" has no key after its modifiers.`,
    );
  if (!spec.mod && !spec.ctrl && !spec.meta && !spec.alt)
    throw new TypeError(
      `useColorModeShortcut: "${keys}" needs mod, ctrl, meta or alt, so it never fires while someone types (WCAG 2.1.4).`,
    );
  return spec;
}

function isApple(): boolean {
  if (typeof navigator === "undefined") return false;
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform ?? navigator.platform;
  return /mac|iphone|ipad|ipod/i.test(platform ?? "");
}

/** The modifiers the shortcut needs once `mod` is resolved. */
function resolve(spec: Spec, apple: boolean) {
  return {
    ctrl: spec.ctrl || (spec.mod && !apple),
    meta: spec.meta || (spec.mod && apple),
    alt: spec.alt,
    shift: spec.shift,
  };
}

function keyName(key: string): string {
  return key.length === 1
    ? key.toUpperCase()
    : key[0]!.toUpperCase() + key.slice(1);
}

function describe(spec: Spec, apple: boolean): ColorModeShortcut {
  const m = resolve(spec, apple);
  const key = keyName(spec.key);
  const aria = [
    m.ctrl && "Control",
    m.alt && "Alt",
    m.shift && "Shift",
    m.meta && "Meta",
    key,
  ].filter(Boolean);
  const label = apple
    ? [m.ctrl && "⌃", m.alt && "⌥", m.shift && "⇧", m.meta && "⌘", key]
        .filter(Boolean)
        .join("")
    : [
        m.ctrl && "Ctrl",
        m.alt && "Alt",
        m.shift && "Shift",
        m.meta && "Win",
        key,
      ]
        .filter(Boolean)
        .join("+");
  return { ariaKeyShortcuts: aria.join("+"), label };
}

/** Typing targets: never steal a key from a field or an editor. */
function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLInputElement)
    return ![
      "button",
      "checkbox",
      "radio",
      "range",
      "reset",
      "submit",
      "color",
      "file",
      "image",
    ].includes(target.type);
  return false;
}

function matches(event: KeyboardEvent, spec: Spec, apple: boolean): boolean {
  const m = resolve(spec, apple);
  if (
    event.ctrlKey !== m.ctrl ||
    event.metaKey !== m.meta ||
    event.altKey !== m.alt ||
    event.shiftKey !== m.shift
  )
    return false;
  // Letters and digits match the physical key, so Shift and Alt (which
  // change event.key, "L" or "¬" for l) and other layouts still work.
  if (/^[a-z]$/.test(spec.key))
    return event.code === `Key${spec.key.toUpperCase()}`;
  if (/^[0-9]$/.test(spec.key)) return event.code === `Digit${spec.key}`;
  return event.key.toLowerCase() === spec.key;
}

// One listener for the whole page, however many components ask for the same
// keys: two ThemeToggles with the hook must not flip the mode twice.
const registered = new Map<string, { spec: Spec; count: number }>();

function onKeyDown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.repeat || event.isComposing) return;
  if (isEditable(event.target)) return;
  const apple = isApple();
  for (const { spec } of registered.values()) {
    if (!matches(event, spec, apple)) continue;
    event.preventDefault();
    toggleColorMode();
    return;
  }
}

function register(id: string, spec: Spec) {
  const entry = registered.get(id);
  if (entry) entry.count += 1;
  else {
    if (registered.size === 0) document.addEventListener("keydown", onKeyDown);
    registered.set(id, { spec, count: 1 });
  }
  return () => {
    const current = registered.get(id);
    if (!current) return;
    current.count -= 1;
    if (current.count > 0) return;
    registered.delete(id);
    if (registered.size === 0)
      document.removeEventListener("keydown", onKeyDown);
  };
}

/**
 * Toggles light / dark on a keyboard shortcut, `mod+shift+l` by default (⌘⇧L
 * on Apple, Ctrl+Shift+L elsewhere). Opt-in: call it once in your layout, or
 * next to a ThemeToggle. Keys typed in a field or editor are left alone, key
 * repeat and IME composition are ignored, and calling it from several
 * components still toggles once. Returns the shortcut for `aria-keyshortcuts`
 * and for display; both say Ctrl until hydration, then follow the platform.
 */
export function useColorModeShortcut(
  keys = "mod+shift+l",
  { enabled = true }: ColorModeShortcutOptions = {},
): ColorModeShortcut {
  const spec = useMemo(() => parse(keys), [keys]);
  const id = useMemo(() => JSON.stringify(spec), [spec]);
  const [apple, setApple] = useState(false);

  useEffect(() => setApple(isApple()), []);
  useEffect(() => {
    if (!enabled) return;
    return register(id, spec);
  }, [enabled, id, spec]);

  return useMemo(() => describe(spec, apple), [spec, apple]);
}
