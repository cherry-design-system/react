import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetColorModeForTests, getColorModeState, setColorModePreference, toggleColorMode } from "./color-mode";
import { createThemeInitScript } from "./theme-init";
import { assertBrandColor, BrandValidationError, createBrand } from "./brand";

function mockSystemDark(dark: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: dark, addEventListener: vi.fn(), removeEventListener: vi.fn() });
}

beforeEach(() => {
  localStorage.clear();
  document.cookie = "theme=; max-age=0; path=/";
  document.documentElement.className = "";
  __resetColorModeForTests();
  mockSystemDark(false);
});
afterEach(() => vi.restoreAllMocks());

describe("color mode store", () => {
  it("follows the OS when nothing is stored", () => {
    mockSystemDark(true);
    expect(getColorModeState()).toEqual({ mode: "dark", preference: "system" });
  });
  it("reads an explicit preference, then the 1.x theme key", () => {
    localStorage.setItem("theme", "dark");
    expect(getColorModeState().preference).toBe("dark");
    __resetColorModeForTests();
    localStorage.setItem("themePreference", "light");
    expect(getColorModeState().preference).toBe("light");
  });
  it("applies the dark class, cookie and storage", () => {
    setColorModePreference("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.cookie).toContain("theme=dark");
    expect(localStorage.getItem("themePreference")).toBe("dark");
    toggleColorMode();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});

describe("theme init script", () => {
  it("sets the mode before paint from storage", () => {
    localStorage.setItem("themePreference", "dark");
    new Function(createThemeInitScript())();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute("content")).toBe("#09090b");
  });
  it("escapes < so the script tag cannot be closed", () => {
    const script = createThemeInitScript({ themeColor: { light: "</script><x>", dark: "#000" } });
    expect(script).not.toContain("</script>");
  });
});

describe("createBrand", () => {
  it("emits a scoped layer block", () => {
    const brand = createBrand("acme", { accent: "#5b5bd6" });
    expect(brand.css).toContain('@layer cherry');
    expect(brand.css).toContain('[data-cherry-brand="acme"]');
    expect(brand.attributes).toEqual({ "data-cherry-brand": "acme" });
  });
  it.each(["red;}body{display:none", "var(--x)", "url(x)", "initial", "#fff\n", "expression(1)", '"#fff"'])("rejects %j", (value) => {
    expect(() => assertBrandColor(value)).toThrow(BrandValidationError);
  });
  it.each(["#fff", "#5b5bd6cc", "rgb(1 2 3 / 50%)", "oklch(0.6 0.2 260)", "rebeccapurple"])("accepts %j", (value) => {
    expect(assertBrandColor(value)).toBe(value);
  });
  it("rejects unsafe names", () => {
    expect(() => createBrand('x"]{}', { accent: "#fff" })).toThrow(BrandValidationError);
  });
});
