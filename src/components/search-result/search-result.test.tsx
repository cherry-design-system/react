import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SearchResult } from "./index";

describe("SearchResult", () => {
  it("is an option with label, description and a hidden arrow", () => {
    render(
      <div role="listbox">
        <SearchResult description="Stacked notifications">Toast</SearchResult>
      </div>,
    );
    const option = screen.getByRole("option", { name: /Toast/ });
    expect(option).toHaveClass("cherry-search-result");
    expect(option).toHaveAttribute("aria-selected", "false");
    expect(
      option.querySelector(".cherry-search-result__arrow"),
    ).toHaveAttribute("aria-hidden", "true");
  });

  it("does not select when disabled", async () => {
    const onSelect = vi.fn();
    render(
      <div role="listbox">
        <SearchResult disabled onSelect={onSelect}>
          Soon
        </SearchResult>
      </div>,
    );
    await userEvent.click(screen.getByRole("option"));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("option")).toHaveAttribute("aria-disabled", "true");
  });
});
