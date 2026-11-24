import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Callout } from "./index";

describe("Callout", () => {
  it("renders title, body and a decorative variant icon", () => {
    const { container } = render(
      <Callout variant="warning" title="Heads up">
        Watch out.
      </Callout>,
    );
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute("data-variant", "warning");
    expect(screen.getByText("Heads up")).toBeInTheDocument();
    expect(screen.getByText("Watch out.")).toBeInTheDocument();
    const icon = container.querySelector(".cherry-callout__icon")!;
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon.querySelector("svg")).toBeInTheDocument();
  });

  it("hides the icon with icon={null} and defaults to neutral", () => {
    const { container } = render(<Callout icon={null}>Note</Callout>);
    expect(container.firstElementChild).toHaveAttribute(
      "data-variant",
      "neutral",
    );
    expect(
      container.querySelector(".cherry-callout__icon"),
    ).not.toBeInTheDocument();
  });

  it("passes role through for urgent messages", () => {
    render(
      <Callout variant="danger" role="alert">
        Failed
      </Callout>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Failed");
  });
});
