import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Prose } from "./index";

describe("Prose", () => {
  it("wraps rich text with size and compact hooks", () => {
    const { container } = render(
      <Prose size="sm" compact>
        <h2>Rendered markdown</h2>
        <p>
          Prose styles <a href="#x">links</a>.
        </p>
      </Prose>,
    );
    const prose = container.firstElementChild!;
    expect(prose).toHaveClass("cherry-prose");
    expect(prose).toHaveAttribute("data-size", "sm");
    expect(prose).toHaveAttribute("data-compact");
    expect(prose.querySelector("h2")).toHaveTextContent("Rendered markdown");
  });
});
