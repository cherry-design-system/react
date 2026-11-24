import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Separator } from "./index";

describe("Separator", () => {
  it("is a separator with orientation", () => {
    render(<Separator orientation="vertical" />);
    const sep = screen.getByRole("separator");
    expect(sep).toHaveAttribute("aria-orientation", "vertical");
    expect(sep).toHaveAttribute("data-orientation", "vertical");
  });
  it("renders a label and can be decorative", () => {
    const { container } = render(<Separator label="or" decorative />);
    const sep = container.firstElementChild!;
    expect(sep).toHaveAttribute("role", "none");
    expect(sep).toHaveAttribute("data-labelled");
    expect(sep).toHaveTextContent("or");
  });
});
