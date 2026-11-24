import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Field } from "../field";
import { NumberField } from "./NumberField";

describe("NumberField", () => {
  it("is a spinbutton with value bounds", () => {
    render(<NumberField aria-label="Qty" defaultValue={24} min={0} max={30} />);
    const spin = screen.getByRole("spinbutton", { name: "Qty" });
    expect(spin).toHaveValue("24");
    expect(spin).toHaveAttribute("aria-valuenow", "24");
    expect(spin).toHaveAttribute("aria-valuemin", "0");
    expect(spin).toHaveAttribute("aria-valuemax", "30");
  });

  it("steps with the buttons and disables them at the bounds", async () => {
    const onValueChange = vi.fn();
    render(
      <NumberField
        aria-label="Qty"
        defaultValue={1}
        min={0}
        max={2}
        onValueChange={onValueChange}
      />,
    );
    const inc = screen.getByRole("button", { name: "Increase" });
    const dec = screen.getByRole("button", { name: "Decrease" });
    expect(inc).toHaveAttribute("tabindex", "-1");
    await userEvent.click(inc);
    expect(screen.getByRole("spinbutton")).toHaveValue("2");
    expect(onValueChange).toHaveBeenLastCalledWith(2);
    expect(inc).toBeDisabled();
    await userEvent.click(dec);
    await userEvent.click(dec);
    expect(screen.getByRole("spinbutton")).toHaveValue("0");
    expect(dec).toBeDisabled();
  });

  it("supports arrows, Page keys and Home/End", async () => {
    render(
      <NumberField
        aria-label="Qty"
        defaultValue={5}
        min={0}
        max={100}
        step={2}
      />,
    );
    const spin = screen.getByRole("spinbutton");
    spin.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(spin).toHaveValue("7");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(spin).toHaveValue("3");
    await userEvent.keyboard("{PageUp}");
    expect(spin).toHaveValue("23");
    await userEvent.keyboard("{End}");
    expect(spin).toHaveValue("100");
    await userEvent.keyboard("{Home}");
    expect(spin).toHaveValue("0");
  });

  it("commits typed text on blur, clamped and snapped to the step precision", async () => {
    const onValueChange = vi.fn();
    render(
      <NumberField
        aria-label="Price"
        step={0.5}
        max={10}
        onValueChange={onValueChange}
      />,
    );
    const spin = screen.getByRole("spinbutton");
    await userEvent.type(spin, "42");
    await userEvent.tab();
    expect(spin).toHaveValue("10.0");
    expect(onValueChange).toHaveBeenLastCalledWith(10);
    await userEvent.clear(spin);
    await userEvent.type(spin, "2,25{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith(2.3);
  });

  it("is invalid and disabled from <Field>", () => {
    render(
      <Field label="Guests" error="Too many" disabled>
        <NumberField defaultValue={3} />
      </Field>,
    );
    const spin = screen.getByLabelText("Guests");
    expect(spin).toHaveAttribute("aria-invalid", "true");
    expect(spin).toBeDisabled();
    expect(screen.getByRole("button", { name: "Increase" })).toBeDisabled();
    expect(spin.closest(".cherry-number-field")).toHaveAttribute(
      "data-invalid",
    );
  });
});
