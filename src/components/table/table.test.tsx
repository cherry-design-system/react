import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table } from "./index";

describe("Table", () => {
  it("wraps a native table in a frame with options as data attributes", () => {
    render(
      <Table striped size="sm" scrollLabel="Releases" className="t">
        <thead>
          <tr>
            <th>Component</th>
            <th data-numeric>Downloads</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Button</td>
            <td data-numeric>1,204</td>
          </tr>
        </tbody>
      </Table>,
    );
    const region = screen.getByRole("region", { name: "Releases" });
    expect(region).toHaveClass("cherry-table");
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).toHaveAttribute("data-striped");
    expect(region).toHaveAttribute("data-hoverable");
    expect(region).toHaveAttribute("data-size", "sm");
    expect(screen.getByRole("table")).toHaveClass("cherry-table__table", "t");
    expect(
      screen.getByRole("columnheader", { name: "Downloads" }),
    ).toHaveAttribute("data-numeric");
  });
  it("is not a focus stop without a scroll label", () => {
    const { container } = render(<Table hoverable={false} />);
    expect(container.firstElementChild).not.toHaveAttribute("tabindex");
    expect(container.firstElementChild).not.toHaveAttribute("data-hoverable");
  });
});
