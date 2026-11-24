import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Flex, Stack } from "./index";

describe("Flex + Stack", () => {
  it("maps props to custom properties and data attributes", () => {
    const { container } = render(
      <Flex
        direction={{ xs: "column", md: "row" }}
        justify="space-between"
        gap={{ lg: 8 }}
        fullWidth
      />,
    );
    const flex = container.firstElementChild as HTMLElement;
    expect(flex).toHaveClass("cherry-flex");
    expect(flex).toHaveAttribute("data-full-width");
    expect(flex.style.getPropertyValue("--_direction-xs")).toBe("column");
    expect(flex.style.getPropertyValue("--_direction-md")).toBe("row");
    expect(flex.style.getPropertyValue("--_justify-xs")).toBe("space-between");
    expect(flex.style.getPropertyValue("--_gap-lg")).toBe(
      "var(--cherry-space-8)",
    );
  });
  it("Stack is a non-wrapping column with a 16px gap", () => {
    const { container } = render(<Stack />);
    const stack = container.firstElementChild as HTMLElement;
    expect(stack.style.getPropertyValue("--_direction-xs")).toBe("column");
    expect(stack.style.getPropertyValue("--_wrap-xs")).toBe("nowrap");
    expect(stack.style.getPropertyValue("--_gap-xs")).toBe(
      "var(--cherry-space-4)",
    );
  });
});
