import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MenuItem } from "./index";

describe("MenuItem", () => {
  it("is a menuitem button with icon, label and shortcut", () => {
    render(
      <MenuItem icon={<svg data-testid="icon" />} shortcut="⌘D">
        Duplicate
      </MenuItem>,
    );
    const item = screen.getByRole("menuitem", { name: /Duplicate/ });
    expect(item).toHaveAttribute("type", "button");
    expect(item).toHaveAttribute("tabindex", "-1");
    expect(item).toHaveAttribute("data-variant", "default");
    expect(screen.getByTestId("icon").parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.getByText("⌘D").tagName).toBe("KBD");
  });

  it("does not run onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <MenuItem disabled onClick={onClick}>
        Archive
      </MenuItem>,
    );
    await userEvent.click(screen.getByRole("menuitem"));
    expect(onClick).not.toHaveBeenCalled();
  });
});
