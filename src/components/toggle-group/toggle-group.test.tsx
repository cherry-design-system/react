import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToggleGroup, ToggleGroupItem } from "./ToggleGroup";

describe("ToggleGroup", () => {
  it("single: a radiogroup where arrows move and select", async () => {
    const onValueChange = vi.fn();
    render(
      <ToggleGroup
        aria-label="Range"
        defaultValue="week"
        onValueChange={onValueChange}
      >
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week">Week</ToggleGroupItem>
        <ToggleGroupItem value="month">Month</ToggleGroupItem>
      </ToggleGroup>,
    );
    const group = screen.getByRole("radiogroup", { name: "Range" });
    expect(group).toHaveAttribute("data-type", "single");
    const week = screen.getByRole("radio", { name: "Week" });
    expect(week).toHaveAttribute("aria-checked", "true");
    expect(week).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", { name: "Day" })).toHaveAttribute(
      "tabindex",
      "-1",
    );

    week.focus();
    await userEvent.keyboard("{ArrowRight}");
    const month = screen.getByRole("radio", { name: "Month" });
    expect(month).toHaveFocus();
    expect(month).toHaveAttribute("aria-checked", "true");
    expect(onValueChange).toHaveBeenLastCalledWith("month");
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Day" })).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(month).toHaveFocus();
    await userEvent.click(screen.getByRole("radio", { name: "Day" }));
    expect(onValueChange).toHaveBeenLastCalledWith("day");
    // Clicking the selected radio keeps it selected.
    await userEvent.click(screen.getByRole("radio", { name: "Day" }));
    expect(screen.getByRole("radio", { name: "Day" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("multiple: a group of pressed buttons", async () => {
    const onValueChange = vi.fn();
    render(
      <ToggleGroup
        type="multiple"
        aria-label="Format"
        defaultValue={["bold"]}
        onValueChange={onValueChange}
      >
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
        <ToggleGroupItem value="underline" disabled>
          Underline
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByRole("group", { name: "Format" })).toBeInTheDocument();
    const bold = screen.getByRole("button", { name: "Bold" });
    const italic = screen.getByRole("button", { name: "Italic" });
    expect(bold).toHaveAttribute("aria-pressed", "true");
    expect(italic).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(italic);
    expect(onValueChange).toHaveBeenLastCalledWith(["bold", "italic"]);
    await userEvent.click(bold);
    expect(onValueChange).toHaveBeenLastCalledWith(["italic"]);
    // Arrows move focus only, skipping disabled items.
    italic.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(bold).toHaveFocus();
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });

  it("controlled value", () => {
    const { rerender } = render(
      <ToggleGroup aria-label="View" value="list">
        <ToggleGroupItem value="list" aria-label="List">
          L
        </ToggleGroupItem>
        <ToggleGroupItem value="grid" aria-label="Grid">
          G
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByRole("radio", { name: "List" })).toBeChecked();
    rerender(
      <ToggleGroup aria-label="View" value="grid">
        <ToggleGroupItem value="list" aria-label="List">
          L
        </ToggleGroupItem>
        <ToggleGroupItem value="grid" aria-label="Grid">
          G
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByRole("radio", { name: "Grid" })).toBeChecked();
  });
});
