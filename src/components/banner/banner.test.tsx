import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Banner } from "./index";

describe("Banner", () => {
  it("is a named region with the variant", () => {
    render(<Banner variant="accent">cherry 2.0 is here</Banner>);
    const region = screen.getByRole("region", { name: "Announcement" });
    expect(region).toHaveAttribute("data-variant", "accent");
    expect(
      screen.queryByRole("button", { name: "Dismiss" }),
    ).not.toBeInTheDocument();
  });

  it("collapses on dismiss, then unmounts and calls onDismiss", async () => {
    const onDismiss = vi.fn();
    render(
      <Banner dismissible onDismiss={onDismiss}>
        Hello
      </Banner>,
    );
    const region = screen.getByRole("region");
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(region).toHaveAttribute("data-dismissed");
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      const event = new Event("transitionend", { bubbles: true });
      Object.assign(event, { propertyName: "grid-template-rows" });
      fireEvent(region, event);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("falls back to a timer when no transition ends", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(
      <Banner dismissible onDismiss={onDismiss} dismissLabel="Schließen">
        Hello
      </Banner>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Schließen" }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
