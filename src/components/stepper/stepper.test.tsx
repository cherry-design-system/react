import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stepper } from "./index";

const steps = [
  { label: "Account", description: "Your details" },
  { label: "Workspace" },
  { label: "Invite" },
];

describe("Stepper", () => {
  it("derives states from current and marks aria-current=step", () => {
    render(<Stepper steps={steps} current={1} aria-label="Setup" />);
    const list = screen.getByRole("list", { name: "Setup" });
    expect(list.tagName).toBe("OL");
    expect(list).toHaveAttribute("data-orientation", "horizontal");
    const items = screen.getAllByRole("listitem");
    expect(items.map((i) => i.getAttribute("data-state"))).toEqual([
      "complete",
      "current",
      "upcoming",
    ]);
    expect(items[1]).toHaveAttribute("aria-current", "step");
    expect(items[0]).not.toHaveAttribute("aria-current");
    expect(items[0]).toHaveTextContent("Completed");
  });

  it("draws a connector between steps only", () => {
    const { container } = render(
      <Stepper steps={steps} current={0} orientation="vertical" />,
    );
    expect(
      container.querySelectorAll(".cherry-stepper__connector"),
    ).toHaveLength(2);
  });

  it("lets a step override its state", () => {
    render(
      <Stepper
        steps={[{ label: "A", state: "complete" }, { label: "B" }]}
        current={0}
      />,
    );
    expect(screen.getAllByRole("listitem")[0]).toHaveAttribute(
      "data-state",
      "complete",
    );
  });
});
