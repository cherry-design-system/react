import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { DateTimePicker } from "./DateTimePicker";

// jsdom has no popover API: a minimal stand-in (see date-picker.test.tsx).
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

describe("DateTimePicker", () => {
  it("drafts day and time, then applies both", async () => {
    const onChange = vi.fn();
    render(
      <DateTimePicker
        aria-label="Meeting"
        locale="en-US"
        hourCycle={12}
        weekStartsOn={1}
        defaultValue={new Date(2026, 10, 27, 9, 30)}
        onChange={onChange}
        name="meeting"
      />,
    );
    const trigger = screen.getByRole("button", { name: "Meeting" });
    expect(trigger).toHaveTextContent("Nov 27, 2026 · 09:30 AM");
    await userEvent.click(trigger);
    expect(
      screen.getByRole("button", { name: "Friday, November 27, 2026" }),
    ).toHaveFocus();
    expect(screen.getByRole("listbox", { name: "Time" })).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Monday, November 30, 2026" }),
    );
    await userEvent.click(screen.getByRole("option", { name: "02:00 PM" }));
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 10, 30, 14, 0));
    expect(trigger).toHaveTextContent("Nov 30, 2026 · 02:00 PM");
    expect(trigger).toHaveFocus();
    expect(
      document.querySelector('input[type="hidden"][name="meeting"]'),
    ).toHaveValue("2026-11-30T14:00");
  });

  it("cancel discards the draft", async () => {
    const onChange = vi.fn();
    render(
      <DateTimePicker
        aria-label="Meeting"
        locale="en-US"
        defaultValue={new Date(2026, 10, 27, 9, 30)}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Meeting" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Saturday, November 28, 2026" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Meeting" })).toHaveTextContent(
      "Nov 27, 2026",
    );
  });

  it("disables Apply until a day is picked", async () => {
    render(<DateTimePicker aria-label="When" />);
    await userEvent.click(screen.getByRole("button", { name: "When" }));
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
  });
});
