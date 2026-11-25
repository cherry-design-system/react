import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ChatInput } from "./index";

describe("ChatInput", () => {
  it("sends on Enter, keeps Shift+Enter as a newline, and clears", async () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);
    const box = screen.getByRole("textbox", { name: "Message" });
    const send = screen.getByRole("button", { name: "Send message" });
    expect(send).toHaveAttribute("aria-disabled", "true");
    await userEvent.type(box, "Hi{Shift>}{Enter}{/Shift}there");
    expect(box).toHaveValue("Hi\nthere");
    expect(send).toHaveAttribute("data-ready");
    await userEvent.type(box, "{Enter}");
    expect(onSend).toHaveBeenCalledWith("Hi\nthere");
    expect(box).toHaveValue("");
  });
  it("never sends blank text or while loading", async () => {
    const onSend = vi.fn();
    const { rerender } = render(<ChatInput onSend={onSend} />);
    const box = screen.getByRole("textbox");
    await userEvent.type(box, "   {Enter}");
    expect(onSend).not.toHaveBeenCalled();
    rerender(<ChatInput onSend={onSend} loading defaultValue="x" />);
    await userEvent.type(box, "go{Enter}");
    expect(onSend).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Waiting for the reply" }),
    ).toBeInTheDocument();
  });
  it("works controlled and through the send button", async () => {
    const onSend = vi.fn();
    function Controlled() {
      const [v, setV] = useState("hello");
      return <ChatInput value={v} onValueChange={setV} onSend={onSend} glow />;
    }
    const { container } = render(<Controlled />);
    expect(container.firstElementChild).toHaveAttribute("data-glow");
    await userEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(onSend).toHaveBeenCalledWith("hello");
    // Controlled: the owner decides whether to clear.
    expect(screen.getByRole("textbox")).toHaveValue("hello");
  });
  it("renders actions and a footnote", () => {
    render(
      <ChatInput
        actions={<button>Attach</button>}
        footnote="Enter to send, Shift+Enter for a new line."
      />,
    );
    expect(screen.getByRole("button", { name: "Attach" })).toBeInTheDocument();
    expect(
      screen.getByText("Enter to send, Shift+Enter for a new line."),
    ).toBeInTheDocument();
  });
});
