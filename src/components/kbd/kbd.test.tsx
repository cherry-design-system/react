import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Kbd } from "./index";

describe("Kbd", () => {
  it("renders a <kbd> chip with a size", () => {
    render(<Kbd size="sm">esc</Kbd>);
    const key = screen.getByText("esc");
    expect(key.tagName).toBe("KBD");
    expect(key).toHaveClass("cherry-kbd");
    expect(key).toHaveAttribute("data-size", "sm");
  });
  it("defaults to md and passes aria-label for icon keys", () => {
    render(<Kbd aria-label="Up arrow">↑</Kbd>);
    const key = screen.getByLabelText("Up arrow");
    expect(key).toHaveAttribute("data-size", "md");
  });
});
