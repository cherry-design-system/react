import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getActiveSection, NavItem, NavPill } from "./index";

// Positions sections for getBoundingClientRect: top in viewport pixels.
function placeSection(id: string, top: number) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("section");
    el.id = id;
    document.body.appendChild(el);
  }
  el.getBoundingClientRect = () =>
    ({
      top,
      bottom: top + 400,
      left: 0,
      right: 0,
      width: 0,
      height: 400,
    }) as DOMRect;
}

function scroll() {
  act(() => {
    document.dispatchEvent(new Event("scroll"));
  });
}

afterEach(() => {
  document.querySelectorAll("section").forEach((s) => s.remove());
  window.history.replaceState(null, "", "/");
});

describe("NavPill position and placement", () => {
  it("is static by default, with no placement", () => {
    render(<NavPill />);
    const nav = screen.getByRole("navigation");
    expect(nav).toHaveAttribute("data-position", "static");
    expect(nav).not.toHaveAttribute("data-placement");
  });

  it("carries position and placement for sticky and fixed", () => {
    render(<NavPill position="fixed" placement="bottom-end" />);
    const nav = screen.getByRole("navigation");
    expect(nav).toHaveAttribute("data-position", "fixed");
    expect(nav).toHaveAttribute("data-placement", "bottom-end");
  });
});

describe("NavPill trackRoute", () => {
  it("marks the deepest link matching the path as the current page", async () => {
    window.history.replaceState(null, "", "/docs/button");
    render(
      <NavPill trackRoute>
        <NavItem href="/">Home</NavItem>
        <NavItem href="/docs">Docs</NavItem>
        <NavItem href="/docs/button">Button</NavItem>
      </NavPill>,
    );
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Button" })).toHaveAttribute(
        "aria-current",
        "page",
      ),
    );
    expect(screen.getByRole("link", { name: "Docs" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("follows a client-side route change", async () => {
    window.history.replaceState(null, "", "/");
    render(
      <NavPill trackRoute>
        <NavItem href="/">Home</NavItem>
        <NavItem href="/docs">Docs</NavItem>
      </NavPill>,
    );
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
        "aria-current",
        "page",
      ),
    );
    act(() => {
      window.history.pushState(null, "", "/docs");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute(
        "aria-current",
        "page",
      ),
    );
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("never overrides an explicit active link", async () => {
    window.history.replaceState(null, "", "/docs");
    render(
      <NavPill trackRoute>
        <NavItem href="/" active>
          Home
        </NavItem>
        <NavItem href="/docs">Docs</NavItem>
      </NavPill>,
    );
    await act(async () => {});
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Docs" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});

describe("NavPill trackSections", () => {
  it("highlights the section in view and hands back to the page above it", async () => {
    window.history.replaceState(null, "", "/");
    placeSection("components", 900);
    placeSection("theming", 1600);
    const { container } = render(
      <NavPill trackRoute trackSections>
        <NavItem href="/">Home</NavItem>
        <NavItem href="#components">Components</NavItem>
        <NavItem href="/#theming">Theming</NavItem>
        <NavItem href="/docs#api">API</NavItem>
      </NavPill>,
    );
    const list = container.querySelector(".cherry-nav-pill__list")!;
    const home = screen.getByRole("link", { name: "Home" });
    await waitFor(() => expect(home).toHaveAttribute("aria-current", "page"));
    expect(list).not.toHaveAttribute("data-location");

    placeSection("components", 100);
    placeSection("theming", 800);
    scroll();
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Components" })).toHaveAttribute(
        "aria-current",
        "location",
      ),
    );
    expect(list).toHaveAttribute("data-location");
    // The page link keeps its meaning; only the highlight moves.
    expect(home).toHaveAttribute("aria-current", "page");

    placeSection("components", -700);
    placeSection("theming", 50);
    scroll();
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Theming" })).toHaveAttribute(
        "aria-current",
        "location",
      ),
    );
    expect(
      screen.getByRole("link", { name: "Components" }),
    ).not.toHaveAttribute("aria-current");
    // A section on another path is never tracked here.
    expect(screen.getByRole("link", { name: "API" })).not.toHaveAttribute(
      "aria-current",
    );

    placeSection("components", 900);
    placeSection("theming", 1600);
    scroll();
    await waitFor(() => expect(list).not.toHaveAttribute("data-location"));
    expect(screen.getByRole("link", { name: "Theming" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});

describe("getActiveSection", () => {
  it("returns the last section above the reading line", () => {
    placeSection("a", -500);
    placeSection("b", 100);
    placeSection("c", 600);
    expect(getActiveSection(["c", "a", "b"])).toBe("b");
    placeSection("b", 400);
    expect(getActiveSection(["a", "b", "c"])).toBe("a");
    placeSection("a", 300);
    expect(getActiveSection(["a", "b", "c"])).toBeNull();
  });
});
