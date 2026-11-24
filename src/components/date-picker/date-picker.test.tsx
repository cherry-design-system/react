import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Field } from "../field";
import { DatePicker } from "./DatePicker";

// jsdom has no popover API: a minimal stand-in that toggles an attribute,
// fires `toggle` with newState, and handles popovertarget clicks.
const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
const setOpen = (el: HTMLElement, open: boolean) => {
  if (el.hasAttribute("data-test-open") === open) return;
  el.toggleAttribute("data-test-open", open);
  // jsdom hides [popover] unless :popover-open, which it never matches.
  el.style.display = open ? "block" : "";
  el.dispatchEvent(
    Object.assign(new Event("toggle"), { newState: open ? "open" : "closed" }),
  );
};
const onClick = (event: MouseEvent) => {
  const invoker = (event.target as Element).closest<HTMLButtonElement>(
    "[popovertarget]",
  );
  if (!invoker || invoker.disabled) return;
  const target = document.getElementById(
    invoker.getAttribute("popovertarget")!,
  );
  if (target) setOpen(target, !target.hasAttribute("data-test-open"));
};
beforeAll(() => {
  proto.showPopover = function (this: HTMLElement) {
    setOpen(this, true);
  };
  proto.hidePopover = function (this: HTMLElement) {
    setOpen(this, false);
  };
  document.addEventListener("click", onClick);
});
afterAll(() => {
  delete proto.showPopover;
  delete proto.hidePopover;
  document.removeEventListener("click", onClick);
});

const isOpen = () =>
  screen.getByRole("dialog", { hidden: true }).hasAttribute("data-test-open");

describe("DatePicker", () => {
  it("opens the calendar in a popover and picks a day", async () => {
    const onChange = vi.fn();
    render(
      <DatePicker
        aria-label="Start date"
        locale="en-US"
        defaultValue={new Date(2026, 10, 27)}
        onChange={onChange}
        name="start"
      />,
    );
    const trigger = screen.getByRole("button", { name: "Start date" });
    expect(trigger).toHaveTextContent("Nov 27, 2026");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    const popover = screen.getByRole("dialog", { hidden: true });
    expect(popover).toHaveAttribute("popover", "auto");
    expect(trigger).toHaveAttribute("popovertarget", popover.id);

    await userEvent.click(trigger);
    expect(isOpen()).toBe(true);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    // Focus lands on the selected day.
    expect(
      screen.getByRole("button", { name: "Friday, November 27, 2026" }),
    ).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}{Enter}");
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 10, 28));
    expect(isOpen()).toBe(false);
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveTextContent("Nov 28, 2026");
    expect(
      document.querySelector('input[type="hidden"][name="start"]'),
    ).toHaveValue("2026-11-28");
  });

  it("shows the placeholder when empty", () => {
    render(<DatePicker aria-label="Due" />);
    expect(screen.getByRole("button", { name: "Due" })).toHaveTextContent(
      "Pick a date",
    );
  });

  it("works inside a Field (label, error, disabled)", () => {
    const { rerender } = render(
      <Field label="Due date" error="Pick a date">
        <DatePicker />
      </Field>,
    );
    const trigger = screen.getByRole("button", { name: /^Due date/ });
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveAccessibleDescription("Pick a date");
    expect(trigger.closest(".cherry-date-picker")).toHaveAttribute(
      "data-invalid",
    );
    rerender(
      <Field label="Due date" disabled>
        <DatePicker />
      </Field>,
    );
    expect(screen.getByRole("button", { name: /^Due date/ })).toBeDisabled();
  });
});
