import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatTyping } from "./index";

describe("ChatTyping", () => {
  it("is a status with a label and three decorative dots", () => {
    const { container } = render(<ChatTyping />);
    expect(screen.getByRole("status")).toHaveTextContent("Thinking…");
    expect(container.querySelectorAll(".cherry-chat-typing__dot")).toHaveLength(
      3,
    );
    expect(
      container.querySelector(".cherry-chat-typing__dots"),
    ).toHaveAttribute("aria-hidden", "true");
  });
  it("folds away when inactive", () => {
    const { container } = render(
      <ChatTyping active={false}>Answering</ChatTyping>,
    );
    const typing = container.firstElementChild!;
    expect(typing).not.toHaveAttribute("data-active");
    expect(typing).toHaveAttribute("aria-hidden", "true");
    expect(typing).not.toHaveTextContent("Answering");
  });
});
