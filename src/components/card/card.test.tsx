import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card, CardDescription, CardIcon, CardTitle } from "./index";

describe("Card", () => {
  it("renders variants and parts", () => {
    const { container } = render(
      <Card variant="elevated" padding="lg" interactive>
        <CardIcon>i</CardIcon>
        <CardTitle level={2}>Token-driven theming</CardTitle>
        <CardDescription>Swap brands.</CardDescription>
      </Card>,
    );
    const card = container.firstElementChild!;
    expect(card).toHaveClass("cherry-card");
    expect(card).toHaveAttribute("data-variant", "elevated");
    expect(card).toHaveAttribute("data-padding", "lg");
    expect(card).toHaveAttribute("data-interactive");
    expect(
      screen.getByRole("heading", { level: 2, name: "Token-driven theming" }),
    ).toHaveClass("cherry-card__title");
  });
  it("defaults to outline / md", () => {
    const { container } = render(<Card />);
    expect(container.firstElementChild).toHaveAttribute(
      "data-variant",
      "outline",
    );
    expect(container.firstElementChild).toHaveAttribute("data-padding", "md");
  });
});
