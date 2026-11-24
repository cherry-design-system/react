import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { Tooltip } from "./index";

// jsdom has no popover API: track "open" with an attribute.
beforeAll(() => {
  const proto = HTMLElement.prototype as HTMLElement & {
    showPopover: () => void;
    hidePopover: () => void;
  };
  if (!("showPopover" in HTMLElement.prototype)) {
    proto.showPopover = function (this: HTMLElement) {
      this.setAttribute("data-test-open", "");
    };
    proto.hidePopover = function (this: HTMLElement) {
      this.removeAttribute("data-test-open");
    };
  }
});

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  // Let the skip-delay window from a previous test lapse.
  vi.advanceTimersByTime(1000);
  vi.useRealTimers();
});

const setup = (props = {}) => {
  render(
    <Tooltip content="Copy to clipboard" {...props}>
      <button type="button">Copy</button>
    </Tooltip>,
  );
  return {
    trigger: screen.getByRole("button", { name: "Copy" }),
    tip: screen.getByRole("tooltip", { hidden: true }),
  };
};

describe("Tooltip", () => {
  it("describes the trigger and renders a manual popover", () => {
    const { trigger, tip } = setup({ placement: "bottom" });
    expect(trigger).toHaveAttribute("aria-describedby", tip.id);
    expect(tip).toHaveAttribute("popover", "manual");
    expect(tip).toHaveAttribute("data-placement", "bottom");
    expect(trigger).toHaveAccessibleDescription("Copy to clipboard");
  });

  it("shows after the hover delay and hides on leave", () => {
    const { trigger, tip } = setup({ openDelay: 400, closeDelay: 100 });
    fireEvent.pointerOver(trigger);
    act(() => vi.advanceTimersByTime(300));
    expect(tip).not.toHaveAttribute("data-test-open");
    act(() => vi.advanceTimersByTime(100));
    expect(tip).toHaveAttribute("data-test-open");
    fireEvent.pointerOut(trigger);
    act(() => vi.advanceTimersByTime(100));
    expect(tip).not.toHaveAttribute("data-test-open");
  });

  it("shows at once on keyboard focus and hides on Escape", () => {
    const { trigger, tip } = setup();
    act(() => trigger.focus());
    expect(tip).toHaveAttribute("data-test-open");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(tip).not.toHaveAttribute("data-test-open");
  });

  it("never shows when disabled", () => {
    const { trigger, tip } = setup({ disabled: true });
    expect(trigger).not.toHaveAttribute("aria-describedby");
    act(() => trigger.focus());
    expect(tip).not.toHaveAttribute("data-test-open");
  });
});
