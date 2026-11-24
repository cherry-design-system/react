import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Field } from "../field";
import { Select } from "./Select";

describe("Select", () => {
  it("is a native combobox with a placeholder option", () => {
    const { container } = render(
      <Select aria-label="Fruit" placeholder="Select an option">
        <option value="apple">Apple</option>
        <option value="pear">Pear</option>
      </Select>,
    );
    const select = screen.getByRole("combobox", { name: "Fruit" });
    expect(select).toHaveValue("");
    const placeholder = container.querySelector("option[data-placeholder]");
    expect(placeholder).toHaveTextContent("Select an option");
    expect(placeholder).toBeDisabled();
    expect(placeholder).toHaveAttribute("hidden");
  });

  it("selects with the keyboard-accessible native control", async () => {
    const onChange = vi.fn();
    render(
      <Select aria-label="Fruit" defaultValue="apple" onChange={onChange}>
        <option value="apple">Apple</option>
        <option value="pear">Pear</option>
      </Select>,
    );
    await userEvent.selectOptions(screen.getByRole("combobox"), "pear");
    expect(screen.getByRole("combobox")).toHaveValue("pear");
    expect(onChange).toHaveBeenCalled();
  });

  it("wires Field label and error", () => {
    render(
      <Field label="Country" error="Required">
        <Select size="lg">
          <option value="al">Albania</option>
        </Select>
      </Field>,
    );
    const select = screen.getByRole("combobox", { name: "Country" });
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAccessibleDescription("Required");
    const wrapper = select.closest(".cherry-select");
    expect(wrapper).toHaveAttribute("data-size", "lg");
    expect(wrapper).toHaveAttribute("data-invalid");
  });
});
