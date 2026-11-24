import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Breadcrumb } from "./index";

describe("Breadcrumb", () => {
  const items = [
    { label: "Docs", href: "/docs" },
    { label: "Components", href: "/docs/components" },
    { label: "Combobox" },
  ];

  it("is a named nav with an ordered list and a current page", () => {
    render(<Breadcrumb items={items} />);
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(nav).toHaveAttribute("data-separator", "chevron");
    expect(nav.querySelector("ol")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute(
      "href",
      "/docs",
    );
    expect(screen.getByText("Combobox")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.queryByRole("link", { name: "Combobox" }),
    ).not.toBeInTheDocument();
  });

  it("hides separators from assistive tech", () => {
    const { container } = render(
      <Breadcrumb items={items} separator="slash" />,
    );
    const seps = container.querySelectorAll(".cherry-breadcrumb__separator");
    expect(seps).toHaveLength(2);
    seps.forEach((s) => expect(s).toHaveAttribute("aria-hidden", "true"));
  });
});
