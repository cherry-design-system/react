import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Tag } from "./Tag";

afterEach(() => {
  vi.useRealTimers();
});

describe("Tag", () => {
  it("renders variants without a remove button by default", () => {
    render(<Tag variant="accent">React</Tag>);
    const tag = screen.getByText("React").closest(".cherry-tag");
    expect(tag).toHaveAttribute("data-variant", "accent");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("plays the exit, then calls onRemove on animationend", async () => {
    const onRemove = vi.fn();
    render(<Tag onRemove={onRemove}>React</Tag>);
    const button = screen.getByRole("button", { name: "Remove React" });
    await userEvent.click(button);
    const tag = screen.getByText("React").closest(".cherry-tag")!;
    expect(tag).toHaveAttribute("data-exiting");
    expect(onRemove).not.toHaveBeenCalled();
    // React picks the vendor-prefixed name when jsdom lacks AnimationEvent.
    fireEvent(tag, new Event("animationend", { bubbles: true }));
    fireEvent(tag, new Event("webkitAnimationEnd", { bubbles: true }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("removes with Delete / Backspace and falls back to a timer", () => {
    vi.useFakeTimers();
    const onRemove = vi.fn();
    render(
      <Tag onRemove={onRemove} removeLabel="Entfernen">
        Vue
      </Tag>,
    );
    const button = screen.getByRole("button", { name: "Entfernen Vue" });
    fireEvent.keyDown(button, { key: "Backspace" });
    act(() => vi.advanceTimersByTime(500));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
