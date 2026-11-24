import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Progress } from "./index";

describe("Progress", () => {
  it("exposes determinate values on a labelled progressbar", () => {
    const { container } = render(
      <Progress value={60} label="Uploading assets" showValue />,
    );
    const bar = screen.getByRole("progressbar", { name: "Uploading assets" });
    expect(bar).toHaveAttribute("aria-valuenow", "60");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("aria-valuetext", "60%");
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(
      (container.firstElementChild as HTMLElement).style.getPropertyValue(
        "--_value",
      ),
    ).toBe("0.6");
  });

  it("clamps out-of-range values", () => {
    render(<Progress value={150} max={50} aria-label="Done" />);
    expect(screen.getByRole("progressbar", { name: "Done" })).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
  });

  it("is indeterminate without a value", () => {
    const { container } = render(<Progress aria-label="Loading" />);
    const bar = screen.getByRole("progressbar", { name: "Loading" });
    expect(bar).not.toHaveAttribute("aria-valuenow");
    expect(container.firstElementChild).toHaveAttribute("data-indeterminate");
  });

  it("sets variant and size hooks", () => {
    const { container } = render(
      <Progress value={1} variant="danger" size="sm" aria-label="x" />,
    );
    expect(container.firstElementChild).toHaveAttribute(
      "data-variant",
      "danger",
    );
    expect(container.firstElementChild).toHaveAttribute("data-size", "sm");
  });
});
