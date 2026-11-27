import { fireEvent, render, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetColorModeForTests, getColorModeState } from "./color-mode";
import { useColorModeShortcut } from "./use-color-mode-shortcut";

const ctrlShiftL: KeyboardEventInit = {
  key: "L",
  code: "KeyL",
  ctrlKey: true,
  shiftKey: true,
};
const press = (
  target: Element | Document = document.body,
  init: KeyboardEventInit = ctrlShiftL,
) => fireEvent.keyDown(target, init);
const mode = () => getColorModeState().mode;

beforeEach(() => {
  localStorage.clear();
  document.cookie = "theme=; max-age=0; path=/";
  document.documentElement.className = "";
  __resetColorModeForTests();
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});
afterEach(() => vi.restoreAllMocks());

describe("useColorModeShortcut", () => {
  it("toggles on mod+shift+l (Ctrl off Apple) and describes the keys", () => {
    const { result } = renderHook(() => useColorModeShortcut());
    expect(result.current).toEqual({
      ariaKeyShortcuts: "Control+Shift+L",
      label: "Ctrl+Shift+L",
    });
    expect(mode()).toBe("light");
    press();
    expect(mode()).toBe("dark");
    press();
    expect(mode()).toBe("light");
  });

  it("needs the exact modifiers", () => {
    renderHook(() => useColorModeShortcut());
    press(document.body, { ...ctrlShiftL, shiftKey: false });
    press(document.body, { ...ctrlShiftL, altKey: true });
    press(document.body, { ...ctrlShiftL, ctrlKey: false, metaKey: true });
    expect(mode()).toBe("light");
  });

  it("leaves fields, editors, key repeat and handled events alone", () => {
    renderHook(() => useColorModeShortcut());
    const { container } = render(
      <div>
        <input />
        <textarea />
        <div contentEditable suppressContentEditableWarning />
      </div>,
    );
    for (const field of container.querySelectorAll(
      "input, textarea, div > div",
    ))
      press(field);
    press(document.body, { ...ctrlShiftL, repeat: true });
    const handled = new KeyboardEvent("keydown", {
      ...ctrlShiftL,
      bubbles: true,
      cancelable: true,
    });
    handled.preventDefault();
    document.body.dispatchEvent(handled);
    expect(mode()).toBe("light");
  });

  it("toggles once however many components use the same keys", () => {
    renderHook(() => {
      useColorModeShortcut();
      useColorModeShortcut("mod+shift+l");
    });
    press();
    expect(mode()).toBe("dark");
  });

  it("stops listening when disabled or unmounted", () => {
    const { rerender, unmount } = renderHook(
      ({ enabled }) => useColorModeShortcut("mod+shift+l", { enabled }),
      { initialProps: { enabled: false } },
    );
    press();
    expect(mode()).toBe("light");
    rerender({ enabled: true });
    press();
    expect(mode()).toBe("dark");
    unmount();
    press();
    expect(mode()).toBe("dark");
  });

  it("uses ⌘ for mod on Apple platforms", () => {
    vi.spyOn(navigator, "platform", "get").mockReturnValue("MacIntel");
    const { result } = renderHook(() => useColorModeShortcut("mod+alt+t"));
    expect(result.current).toEqual({
      ariaKeyShortcuts: "Alt+Meta+T",
      label: "⌥⌘T",
    });
    press(document.body, {
      key: "†",
      code: "KeyT",
      metaKey: true,
      altKey: true,
    });
    expect(mode()).toBe("dark");
  });

  it("rejects keys that would fire while typing, and unknown modifiers", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useColorModeShortcut("shift+l"))).toThrow(
      /WCAG 2\.1\.4/,
    );
    expect(() => renderHook(() => useColorModeShortcut("l"))).toThrow(
      /WCAG 2\.1\.4/,
    );
    expect(() => renderHook(() => useColorModeShortcut("hyper+l"))).toThrow(
      /unknown modifier/,
    );
    expect(() => renderHook(() => useColorModeShortcut("ctrl+shift"))).toThrow(
      /no key/,
    );
  });
});
