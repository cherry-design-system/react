import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Field } from "../field";
import { TimePicker } from "./TimePicker";

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

describe("TimePicker", () => {
  it("lists slots by step and picks one with the keyboard", async () => {
    const onChange = vi.fn();
    render(
      <TimePicker
        aria-label="Start"
        locale="en-US"
        hourCycle={12}
        step={30}
        min="08:00"
        max="12:00"
        defaultValue="09:30"
        onChange={onChange}
        name="start"
      />,
    );
    const trigger = screen.getByRole("button", { name: "Start" });
    expect(trigger).toHaveTextContent("09:30 AM");
    await userEvent.click(trigger);
    const listbox = screen.getByRole("listbox", { name: "Times" });
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(9);
    expect(options[0]).toHaveTextContent("08:00 AM");
    const selected = screen.getByRole("option", { selected: true });
    expect(selected).toHaveTextContent("09:30 AM");
    expect(selected).toHaveFocus();
    expect(listbox).toContainElement(selected);

    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(screen.getByRole("option", { name: "10:30 AM" })).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("option", { name: "12:00 PM" })).toHaveFocus();
    await userEvent.keyboard("{Home}{Enter}");
    expect(onChange).toHaveBeenCalledWith("08:00");
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveTextContent("08:00 AM");
    expect(
      document.querySelector('input[type="hidden"][name="start"]'),
    ).toHaveValue("08:00");
  });

  it("uses a 24-hour clock when asked", () => {
    render(
      <TimePicker
        aria-label="At"
        locale="en-US"
        hourCycle={24}
        defaultValue="14:30"
      />,
    );
    expect(screen.getByRole("button", { name: "At" })).toHaveTextContent(
      "14:30",
    );
  });

  it("columns layout: hours, minutes and AM/PM listboxes", async () => {
    const onChange = vi.fn();
    render(
      <TimePicker
        aria-label="Alarm"
        layout="columns"
        locale="en-US"
        hourCycle={12}
        step={15}
        defaultValue="09:30"
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Alarm" }));
    const hours = screen.getByRole("listbox", { name: "Hours" });
    const minutes = screen.getByRole("listbox", { name: "Minutes" });
    expect(screen.getByRole("listbox", { name: "AM/PM" })).toBeInTheDocument();
    expect(minutes.querySelectorAll('[role="option"]')).toHaveLength(4);
    expect(hours.querySelector('[aria-selected="true"]')).toHaveTextContent(
      "09",
    );
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("10:30");
    await userEvent.keyboard("{ArrowRight}");
    expect(minutes).toContainElement(document.activeElement as HTMLElement);
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("10:45");
    await userEvent.keyboard("{ArrowRight}{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("22:45");
  });

  it("is invalid inside a Field with an error", () => {
    render(
      <Field label="Time" error="Required">
        <TimePicker />
      </Field>,
    );
    expect(screen.getByRole("button", { name: /^Time/ })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
