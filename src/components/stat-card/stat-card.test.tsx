import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatCard } from "./index";

describe("StatCard", () => {
  it("renders value, delta with a spoken trend, and a sparkline", () => {
    const { container } = render(
      <StatCard
        label="Monthly active users"
        value="12,480"
        delta="+12.4%"
        trend="up"
        deltaLabel="vs last month"
        data={[3, 5, 4, 8, 7, 10]}
      />,
    );
    const card = container.firstElementChild!;
    expect(card).toHaveAttribute("data-trend", "up");
    expect(card.querySelector(".cherry-stat-card__delta")).toHaveTextContent(
      "Up +12.4%",
    );
    const line = card.querySelector(".cherry-stat-card__line")!;
    expect(line.getAttribute("d")).toMatch(/^M0\.00 /);
    const area = card.querySelector(".cherry-stat-card__area")!;
    const gradient = card.querySelector("linearGradient")!;
    expect(area.getAttribute("fill")).toBe(`url(#${gradient.id})`);
    expect(card.querySelector(".cherry-stat-card__spark")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
  it("handles a flat series and inverse semantics", () => {
    const { container } = render(
      <StatCard label="Cost" value="$4" trend="up" inverse data={[2, 2]} />,
    );
    expect(container.firstElementChild).toHaveAttribute("data-inverse");
    expect(container.querySelector(".cherry-stat-card__line")).not.toBeNull();
  });
  it("omits the sparkline with fewer than two points", () => {
    const { container } = render(<StatCard label="x" value="1" data={[1]} />);
    expect(container.querySelector("svg")).toBeNull();
  });
});
