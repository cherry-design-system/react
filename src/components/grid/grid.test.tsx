import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Col, Grid } from "./index";
import { responsiveVars } from "../../utils/responsive";

describe("Grid + Col", () => {
  it("writes responsive props as per-breakpoint custom properties", () => {
    const { container } = render(
      <Grid cols={{ xs: 1, md: 2, lg: 4 }} gap={4}>
        <Col span={{ xs: "full", md: 2 }}>a</Col>
      </Grid>,
    );
    const grid = container.firstElementChild as HTMLElement;
    expect(grid).toHaveClass("cherry-grid");
    expect(grid.style.getPropertyValue("--_cols-xs")).toBe("1");
    expect(grid.style.getPropertyValue("--_cols-md")).toBe("2");
    expect(grid.style.getPropertyValue("--_cols-lg")).toBe("4");
    expect(grid.style.getPropertyValue("--_cols-sm")).toBe("");
    expect(grid.style.getPropertyValue("--_gap-xs")).toBe(
      "var(--cherry-space-4)",
    );
    const col = grid.firstElementChild as HTMLElement;
    expect(col.style.getPropertyValue("--_span-xs")).toBe("1 / -1");
    expect(col.style.getPropertyValue("--_span-md")).toBe("span 2");
  });
  it("keeps a caller's style and writes nothing when no props are set", () => {
    const { container } = render(<Grid style={{ color: "red" }} />);
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.getAttribute("style")).toBe("color: red;");
  });
  it("responsiveVars maps a scalar to xs", () => {
    expect(responsiveVars("x", 3)).toEqual({ "--_x-xs": "3" });
    expect(responsiveVars("x", undefined)).toEqual({});
  });
});
