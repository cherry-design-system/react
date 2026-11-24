import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Snippet } from "./Snippet";

const realClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
const mockClipboard = (writeText: (text: string) => Promise<void>) =>
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });

afterEach(() => {
  vi.useRealTimers();
  if (realClipboard)
    Object.defineProperty(navigator, "clipboard", realClipboard);
  else delete (navigator as unknown as Record<string, unknown>).clipboard;
});

describe("Snippet", () => {
  it("copies the command and swaps to a check, then resets", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    const onCopy = vi.fn();
    render(
      <Snippet onCopy={onCopy}>pnpm add @cherry-design-system/react</Snippet>,
    );
    mockClipboard(writeText);
    const button = screen.getByRole("button", { name: "Copy" });
    vi.useFakeTimers();
    await act(async () => button.click());
    expect(writeText).toHaveBeenCalledWith(
      "pnpm add @cherry-design-system/react",
    );
    expect(onCopy).toHaveBeenCalled();
    expect(button).toHaveAccessibleName("Copied");
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
    expect(button.closest(".cherry-snippet")).toHaveAttribute("data-copied");
    act(() => vi.advanceTimersByTime(2000));
    expect(button).toHaveAccessibleName("Copy");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("never copies the prompt, and can copy other text", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    render(
      <Snippet prompt=">" copyText="npm i cherry">
        npm i cherry # shown
      </Snippet>,
    );
    mockClipboard(writeText);
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenCalledWith("npm i cherry");
  });

  it("selects the text when the clipboard is unavailable", async () => {
    mockClipboard(() => Promise.reject(new Error("denied")));
    render(<Snippet>echo hi</Snippet>);
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(window.getSelection()?.toString()).toBe("echo hi");
  });
});
