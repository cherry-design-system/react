import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmButton } from "./ConfirmButton";

afterEach(() => {
  vi.useRealTimers();
});

describe("ConfirmButton", () => {
  it("asks before running onConfirm", async () => {
    const onConfirm = vi.fn();
    render(<ConfirmButton aria-label="Delete file" onConfirm={onConfirm} />);
    const trigger = screen.getByRole("button", { name: "Delete file" });
    const root = trigger.closest(".cherry-confirm-button")!;
    expect(root).toHaveAttribute("data-state", "idle");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    // The idle panel is inert: its buttons are out of reach.
    const panel = document.getElementById(
      trigger.getAttribute("aria-controls")!,
    );
    expect(panel).toHaveAttribute("inert");

    await userEvent.click(trigger);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(root).toHaveAttribute("data-state", "confirm");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(panel).not.toHaveAttribute("inert");
    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(confirm).toHaveFocus();

    await userEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(root).toHaveAttribute("data-state", "idle");
    expect(trigger).toHaveFocus();
  });

  it("cancels with the cancel button and with Escape", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmButton
        aria-label="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Delete" });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(trigger).toHaveFocus();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("resets by itself after the timeout", async () => {
    vi.useFakeTimers();
    render(<ConfirmButton onConfirm={() => {}} resetAfter={3000} />);
    const trigger = screen.getByRole("button", { name: "Delete" });
    act(() => trigger.click());
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    act(() => vi.advanceTimersByTime(3000));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("uses translatable labels", async () => {
    render(
      <ConfirmButton
        aria-label="Löschen"
        confirmLabel="Bestätigen"
        cancelLabel="Abbrechen"
        onConfirm={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Löschen" }));
    expect(screen.getByRole("group", { name: "Löschen" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bestätigen" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Abbrechen" }),
    ).toBeInTheDocument();
  });
});
