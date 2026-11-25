import { render, screen, waitFor } from "@testing-library/react";
import { createRef, forwardRef, type AnchorHTMLAttributes } from "react";
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

describe("NavItem asChild", () => {
  // Stands in for a router link (Next.js <Link>): renders an <a> itself.
  const RouterLink = forwardRef<
    HTMLAnchorElement,
    AnchorHTMLAttributes<HTMLAnchorElement>
  >(function RouterLink(props, ref) {
    return <a ref={ref} data-router="" {...props} />;
  });

  it("renders the child link with the item's class, state and icon", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <NavPill>
        <NavItem asChild active icon={<svg data-testid="icon" />} ref={ref}>
          <RouterLink href="/docs" className="mine">
            Docs
          </RouterLink>
        </NavItem>
      </NavPill>,
    );
    const link = screen.getByRole("link", { name: "Docs" });
    expect(link).toHaveAttribute("data-router");
    expect(link).toHaveClass("cherry-nav-item__link", "mine");
    expect(link).toHaveAttribute("aria-current", "page");
    expect(link).toContainElement(screen.getByTestId("icon"));
    expect(ref.current).toBe(link);
    expect(link.parentElement).toHaveClass("cherry-nav-item");
  });

  it("is tracked like a plain item", async () => {
    window.history.replaceState(null, "", "/docs");
    render(
      <NavPill trackRoute>
        <NavItem asChild>
          <RouterLink href="/">Home</RouterLink>
        </NavItem>
        <NavItem asChild>
          <RouterLink href="/docs">Docs</RouterLink>
        </NavItem>
      </NavPill>,
    );
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute(
        "aria-current",
        "page",
      ),
    );
    window.history.replaceState(null, "", "/");
  });
});
