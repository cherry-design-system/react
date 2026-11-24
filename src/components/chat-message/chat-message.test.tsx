import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatMessage } from "./index";

describe("ChatMessage", () => {
  it("renders the role, avatar and actions", () => {
    const { container } = render(
      <ChatMessage avatar={<span>A</span>} actions={<button>Copy</button>}>
        Pass a light and a dark theme.
      </ChatMessage>,
    );
    const msg = container.firstElementChild!;
    expect(msg).toHaveAttribute("data-role", "assistant");
    expect(msg.querySelector(".cherry-chat-message__avatar")).toHaveTextContent(
      "A",
    );
    expect(
      msg.querySelector(".cherry-chat-message__actions"),
    ).toHaveTextContent("Copy");
  });
  it("marks user bubbles, streaming and still messages", () => {
    const { container } = render(
      <ChatMessage role="user" streaming still>
        How does theming work?
      </ChatMessage>,
    );
    const msg = container.firstElementChild!;
    expect(msg).toHaveAttribute("data-role", "user");
    expect(msg).toHaveAttribute("data-streaming");
    expect(msg).toHaveAttribute("aria-busy", "true");
    expect(msg).toHaveAttribute("data-still");
    expect(msg).not.toHaveAttribute("role");
  });
});
