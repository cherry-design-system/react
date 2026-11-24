import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar, toInitials } from "./index";

describe("Avatar", () => {
  it("shows initials with an accessible name", () => {
    render(<Avatar name="Ada Lovelace" size="lg" color="accent" />);
    const avatar = screen.getByRole("img", { name: "Ada Lovelace" });
    expect(avatar).toHaveTextContent("AL");
    expect(avatar).toHaveAttribute("data-size", "lg");
    expect(avatar).toHaveAttribute("data-color", "accent");
  });
  it("fades the image in on load and falls back to initials on error", () => {
    const { container } = render(<Avatar name="Grace Hopper" src="/a.png" />);
    const root = container.firstElementChild as HTMLElement;
    const img = container.querySelector("img")!;
    expect(root).not.toHaveAttribute("data-loaded");
    fireEvent.load(img);
    expect(root).toHaveAttribute("data-loaded");
    fireEvent.error(img);
    expect(container.querySelector("img")).toBeNull();
    expect(root).not.toHaveAttribute("data-loaded");
    expect(root).toHaveTextContent("GH");
  });
  it("announces the status in the name", () => {
    render(<Avatar name="Ada" status="online" />);
    expect(screen.getByRole("img", { name: "Ada (Online)" })).toHaveAttribute(
      "data-status",
      "online",
    );
  });
  it("renders the icon fallback without a name", () => {
    const { container } = render(<Avatar />);
    expect(container.querySelector("svg")).not.toBeNull();
  });
  it("builds initials", () => {
    expect(toInitials("  cherry  ")).toBe("C");
    expect(toInitials("ada byron lovelace")).toBe("AB");
  });
});
