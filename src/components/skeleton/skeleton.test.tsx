import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./index";

describe("Skeleton", () => {
  it("is decorative and renders text lines", () => {
    const { container } = render(<Skeleton lines={3} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveAttribute("data-shape", "text");
    expect(root.querySelectorAll(".cherry-skeleton__line")).toHaveLength(3);
  });

  it("passes sizes as custom properties", () => {
    const { container } = render(<Skeleton shape="circle" width={48} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("data-shape", "circle");
    expect(root.style.getPropertyValue("--_w")).toBe("48px");
    expect(root.querySelector(".cherry-skeleton__line")).toBeNull();
  });

  it("accepts CSS lengths for rect", () => {
    const { container } = render(
      <Skeleton shape="rect" width="50%" height="8rem" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue("--_h")).toBe("8rem");
  });
});
