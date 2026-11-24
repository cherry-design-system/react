import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "../avatar";
import { AvatarGroup } from "./index";

describe("AvatarGroup", () => {
  it("caps the row and counts the rest", () => {
    render(
      <AvatarGroup max={2} size="sm" aria-label="Team">
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" size="lg" />
        <Avatar name="Alan Turing" />
        <Avatar name="Linus T" />
      </AvatarGroup>,
    );
    const group = screen.getByRole("group", { name: "Team" });
    expect(group).toHaveAttribute("data-size", "sm");
    expect(screen.getByRole("img", { name: "Ada Lovelace" })).toHaveAttribute(
      "data-size",
      "sm",
    );
    // An explicit size on a child wins.
    expect(screen.getByRole("img", { name: "Grace Hopper" })).toHaveAttribute(
      "data-size",
      "lg",
    );
    expect(screen.queryByRole("img", { name: "Alan Turing" })).toBeNull();
    expect(screen.getByRole("img", { name: "2 more" })).toHaveTextContent("+2");
  });
});
