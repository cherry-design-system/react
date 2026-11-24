import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ChatInput } from "../chat-input";
import { ChatLauncher, ChatMessageList, ChatPanel } from "./index";

beforeAll(() => {
  // jsdom has no <dialog> methods.
  HTMLDialogElement.prototype.show = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
    this.dataset.modal = "";
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  window.matchMedia = vi.fn().mockReturnValue({ matches: false });
});

describe("ChatPanel", () => {
  it("opens a drawer dialog, focuses the composer and closes via the button", async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <ChatPanel open title="cherry Assistant" onOpenChange={onOpenChange}>
        <ChatMessageList>hi</ChatMessageList>
        <ChatInput />
      </ChatPanel>,
    );
    const dialog = document.querySelector("dialog")!;
    expect(dialog).toHaveAttribute("open");
    expect(dialog).toHaveAttribute("data-variant", "drawer");
    expect(dialog).toHaveAttribute("data-side", "right");
    expect(dialog).toHaveAttribute("aria-label", "cherry Assistant");
    // Non-modal above lg.
    expect(dialog.dataset.modal).toBeUndefined();
    expect(screen.getByRole("textbox")).toHaveFocus();
    expect(screen.getByRole("log")).toHaveTextContent("hi");

    await userEvent.click(screen.getByRole("button", { name: "Close chat" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    rerender(<ChatPanel open={false} title="cherry Assistant" />);
    expect(dialog).not.toHaveAttribute("open");
  });
  it("closes on Escape", () => {
    const onOpenChange = vi.fn();
    render(<ChatPanel open onOpenChange={onOpenChange} variant="fullscreen" />);
    const dialog = document.querySelector("dialog")!;
    expect(dialog.dataset.modal).toBe("");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    // A modal dialog's native cancel (Escape) stays controlled too.
    const cancel = new Event("cancel", { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });
  it("inline panels are a plain section without a close button", () => {
    render(<ChatPanel variant="inline" title="Assistant" />);
    expect(screen.getByRole("region", { name: "Assistant" })).toHaveAttribute(
      "data-variant",
      "inline",
    );
    expect(screen.queryByRole("button", { name: "Close chat" })).toBeNull();
  });
});

describe("ChatLauncher", () => {
  it("is a button with a default label", () => {
    render(<ChatLauncher glow aria-expanded={false} />);
    const button = screen.getByRole("button", { name: "Ask AI" });
    expect(button).toHaveAttribute("data-glow");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });
});

describe("ChatMessageList", () => {
  it("follows new messages, also after a StrictMode remount", () => {
    let queued: FrameRequestCallback[] = [];
    const flush = () => {
      const run = queued;
      queued = [];
      run.forEach((cb) => cb(0));
    };
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      queued.push(cb);
      return queued.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {
      queued = [];
    });
    const scrollTo = vi.fn();
    HTMLElement.prototype.scrollTo = scrollTo;
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get: () => 500,
    });
    const { rerender } = render(
      <StrictMode>
        <ChatMessageList>
          <p>one</p>
        </ChatMessageList>
      </StrictMode>,
    );
    flush();
    scrollTo.mockClear();
    rerender(
      <StrictMode>
        <ChatMessageList>
          <p>one</p>
          <p>two</p>
        </ChatMessageList>
      </StrictMode>,
    );
    flush();
    expect(scrollTo).toHaveBeenCalledWith({ top: 500, behavior: "smooth" });
    vi.restoreAllMocks();
  });
});
