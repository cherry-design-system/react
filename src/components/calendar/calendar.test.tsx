import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Calendar } from "./Calendar";

const today = new Date(2026, 10, 24);
const day = (name: string) => screen.getByRole("button", { name });

describe("Calendar", () => {
  it("renders a labelled month grid with weekday headers", () => {
    render(
      <Calendar
        locale="en-US"
        weekStartsOn={1}
        today={today}
        defaultValue={new Date(2026, 10, 27)}
      />,
    );
    const grid = screen.getByRole("grid", { name: "November 2026" });
    expect(grid).toBeInTheDocument();
    const headers = screen.getAllByRole("columnheader");
    expect(headers).toHaveLength(7);
    expect(headers[0]).toHaveAccessibleName("Monday");
    expect(screen.getAllByRole("gridcell")).toHaveLength(42);
    expect(day("Tuesday, November 24, 2026")).toHaveAttribute(
      "aria-current",
      "date",
    );
    const selected = day("Friday, November 27, 2026");
    expect(selected.closest('[role="gridcell"]')).toHaveAttribute(
      "aria-selected",
      "true",
    );
    // Roving tabindex: only the selected day is tabbable.
    expect(selected).toHaveAttribute("tabindex", "0");
    expect(day("Saturday, November 28, 2026")).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  it("starts the week on Sunday when asked", () => {
    render(<Calendar locale="en-US" weekStartsOn={0} today={today} />);
    expect(screen.getAllByRole("columnheader")[0]).toHaveAccessibleName(
      "Sunday",
    );
  });

  it("selects a day on click", async () => {
    const onChange = vi.fn();
    render(
      <Calendar
        locale="en-US"
        weekStartsOn={1}
        today={today}
        onChange={onChange}
      />,
    );
    await userEvent.click(day("Thursday, November 12, 2026"));
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 10, 12));
    expect(
      day("Thursday, November 12, 2026").closest('[role="gridcell"]'),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("moves focus with arrows, Home/End and PageUp/PageDown", async () => {
    const user = userEvent.setup();
    render(
      <Calendar
        locale="en-US"
        weekStartsOn={1}
        today={today}
        defaultValue={new Date(2026, 10, 27)}
      />,
    );
    day("Friday, November 27, 2026").focus();
    await user.keyboard("{ArrowRight}");
    expect(day("Saturday, November 28, 2026")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(day("Saturday, November 21, 2026")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(day("Monday, November 16, 2026")).toHaveFocus();
    await user.keyboard("{End}");
    expect(day("Sunday, November 22, 2026")).toHaveFocus();
    await user.keyboard("{PageDown}");
    expect(
      screen.getByRole("grid", { name: "December 2026" }),
    ).toBeInTheDocument();
    expect(day("Tuesday, December 22, 2026")).toHaveFocus();
    // The leaving month is hidden from assistive tech while it animates out.
    expect(screen.getAllByRole("gridcell")).toHaveLength(42);
    await user.keyboard("{Shift>}{PageUp}{/Shift}");
    expect(
      screen.getByRole("grid", { name: "December 2025" }),
    ).toBeInTheDocument();
    expect(day("Monday, December 22, 2025")).toHaveFocus();
  });

  it("crosses into the next month with the arrow keys", async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    render(
      <Calendar
        locale="en-US"
        weekStartsOn={1}
        today={today}
        defaultValue={new Date(2026, 10, 30)}
        onMonthChange={onMonthChange}
      />,
    );
    day("Monday, November 30, 2026").focus();
    await user.keyboard("{ArrowRight}");
    expect(onMonthChange).toHaveBeenCalledWith(new Date(2026, 11, 1));
    expect(day("Tuesday, December 1, 2026")).toHaveFocus();
  });

  it("navigates with the header buttons", async () => {
    render(<Calendar locale="en-US" today={today} />);
    await userEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(
      screen.getByRole("grid", { name: "December 2026" }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Previous month" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Previous month" }),
    );
    expect(
      screen.getByRole("grid", { name: "October 2026" }),
    ).toBeInTheDocument();
  });

  it("blocks days outside min/max and disabled days", async () => {
    const onChange = vi.fn();
    render(
      <Calendar
        locale="en-US"
        weekStartsOn={1}
        today={today}
        min={new Date(2026, 10, 10)}
        max={new Date(2026, 10, 20)}
        isDateDisabled={(d) => d.getDate() === 15}
        onChange={onChange}
      />,
    );
    const early = day("Monday, November 9, 2026");
    expect(early).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(early);
    await userEvent.click(day("Sunday, November 15, 2026"));
    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Previous month" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
  });

  it("selects a range in two clicks", async () => {
    const onChange = vi.fn();
    render(
      <Calendar
        mode="range"
        locale="en-US"
        weekStartsOn={1}
        today={today}
        onChange={onChange}
      />,
    );
    await userEvent.click(day("Wednesday, November 25, 2026"));
    expect(onChange).toHaveBeenLastCalledWith({
      start: new Date(2026, 10, 25),
      end: null,
    });
    // Picking an earlier day second still yields start <= end.
    await userEvent.click(day("Wednesday, November 18, 2026"));
    expect(onChange).toHaveBeenLastCalledWith({
      start: new Date(2026, 10, 18),
      end: new Date(2026, 10, 25),
    });
    const cell = (name: string) => day(name).closest('[role="gridcell"]');
    expect(cell("Wednesday, November 18, 2026")).toHaveAttribute(
      "data-range",
      "start",
    );
    expect(cell("Saturday, November 21, 2026")).toHaveAttribute(
      "data-range",
      "middle",
    );
    expect(cell("Saturday, November 21, 2026")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(cell("Wednesday, November 25, 2026")).toHaveAttribute(
      "data-range",
      "end",
    );
    expect(cell("Thursday, November 26, 2026")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });
});
