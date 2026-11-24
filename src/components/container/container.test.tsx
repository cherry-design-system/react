import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Container } from "./index";

describe("Container", () => {
  it("renders fluid and responsive padding", () => {
    const { container } = render(
      <Container fluid padding={{ xs: 4, lg: 10 }}>
        x
      </Container>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveClass("cherry-container");
    expect(el).toHaveAttribute("data-fluid");
    expect(el.style.getPropertyValue("--_padding-lg")).toBe(
      "var(--cherry-space-10)",
    );
  });
});
