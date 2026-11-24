import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Link } from "./index";

describe("Link", () => {
  it("renders a variant", () => {
    render(
      <Link href="/docs" variant="muted">
        Read the docs
      </Link>,
    );
    const link = screen.getByRole("link", { name: "Read the docs" });
    expect(link).toHaveAttribute("data-variant", "muted");
    expect(link).not.toHaveAttribute("target");
  });
  it("opens external links safely and says so", () => {
    render(
      <Link href="https://cherry.al" external>
        cherry
      </Link>,
    );
    const link = screen.getByRole("link", {
      name: /cherry\s*\(opens in a new tab\)/,
    });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("data-external");
  });
});
