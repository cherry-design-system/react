import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NavItem, NavPill } from "./index";

describe("NavPill", () => {
  it("is a named nav with a list of links", () => {
    render(
      <NavPill aria-label="Primary">
        <NavItem href="/" active>
          Home
        </NavItem>
        <NavItem href="/components">Components</NavItem>
      </NavPill>,
    );
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(nav).toHaveClass("cherry-nav-pill");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "Components" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("places the indicator on the current item", async () => {
    const { container, rerender } = render(
      <NavPill>
        <NavItem href="/">Home</NavItem>
      </NavPill>,
    );
    const list = container.querySelector(".cherry-nav-pill__list")!;
    expect(list).not.toHaveAttribute("data-indicator");
    rerender(
      <NavPill>
        <NavItem href="/" active>
          Home
        </NavItem>
      </NavPill>,
    );
    await waitFor(() => expect(list).toHaveAttribute("data-indicator"));
  });

  it("defaults the landmark name", () => {
    render(<NavPill />);
    expect(
      screen.getByRole("navigation", { name: "Main" }),
    ).toBeInTheDocument();
  });
});
