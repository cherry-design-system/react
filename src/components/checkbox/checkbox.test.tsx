import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Field } from "../field";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("is a native checkbox named by its label", async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Accept terms" size="lg" onChange={onChange} />);
    const box = screen.getByRole("checkbox", { name: "Accept terms" });
    expect(box.closest(".cherry-checkbox")).toHaveAttribute("data-size", "lg");
    await userEvent.click(box);
    expect(box).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("toggles with Space", async () => {
    render(<Checkbox label="Remember me" />);
    const box = screen.getByRole("checkbox");
    box.focus();
    await userEvent.keyboard(" ");
    expect(box).toBeChecked();
  });

  it("supports the indeterminate (mixed) state", () => {
    const { rerender } = render(<Checkbox label="All" indeterminate />);
    const box = screen.getByRole("checkbox");
    expect(box).toBePartiallyChecked();
    rerender(<Checkbox label="All" indeterminate={false} />);
    expect(box).not.toBePartiallyChecked();
  });

  it("forwards the ref while keeping indeterminate working", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Checkbox ref={ref} label="All" indeterminate />);
    expect(ref.current?.indeterminate).toBe(true);
  });

  it("marks errors and works inside <Field>", () => {
    render(
      <Field label="Terms" error="You must accept">
        <Checkbox label="Accept" />
      </Field>,
    );
    const box = screen.getByRole("checkbox", { name: /Accept/ });
    expect(box).toHaveAttribute("aria-invalid", "true");
    expect(box).toHaveAccessibleDescription("You must accept");
    expect(box.closest(".cherry-checkbox")).toHaveAttribute("data-invalid");
  });

  it("disables", async () => {
    render(<Checkbox label="Off" disabled />);
    const box = screen.getByRole("checkbox");
    await userEvent.click(box);
    expect(box).not.toBeChecked();
    expect(box.closest(".cherry-checkbox")).toHaveAttribute("data-disabled");
  });
});
