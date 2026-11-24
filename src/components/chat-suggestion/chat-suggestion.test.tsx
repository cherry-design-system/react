import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatSuggestion, ChatSuggestions } from "./index";

describe("ChatSuggestion", () => {
  it("renders button chips in a named group", async () => {
    const onClick = vi.fn();
    render(
      <ChatSuggestions>
        <ChatSuggestion onClick={onClick}>Explain modes</ChatSuggestion>
      </ChatSuggestions>,
    );
    expect(
      screen.getByRole("group", { name: "Suggestions" }),
    ).toBeInTheDocument();
    const chip = screen.getByRole("button", { name: "Explain modes" });
    expect(chip).toHaveAttribute("type", "button");
    await userEvent.click(chip);
    expect(onClick).toHaveBeenCalled();
  });
});
