import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Field } from "../field";
import { Range } from "./Range";

const ratio = (el: HTMLElement) =>
  el.closest<HTMLElement>(".cherry-range")?.style.getPropertyValue("--_ratio");

describe("Range", () => {
  it("is a native slider", () => {
    render(<Range aria-label="Volume" min={0} max={10} defaultValue={4} />);
    const slider = screen.getByRole("slider", { name: "Volume" });
    expect(slider).toHaveAttribute("type", "range");
    expect(slider).toHaveValue("4");
    expect(ratio(slider)).toBe("0.4");
  });

  it("updates the fill as the value changes (uncontrolled)", () => {
    const onChange = vi.fn();
    render(<Range aria-label="Volume" onChange={onChange} />);
    const slider = screen.getByRole("slider");
    expect(ratio(slider)).toBe("0.5");
    fireEvent.change(slider, { target: { value: "75" } });
    expect(ratio(slider)).toBe("0.75");
    expect(onChange).toHaveBeenCalled();
  });

  it("follows a controlled value", () => {
    const { rerender } = render(
      <Range aria-label="V" value={20} onChange={() => {}} />,
    );
    expect(ratio(screen.getByRole("slider"))).toBe("0.2");
    rerender(<Range aria-label="V" value={90} onChange={() => {}} />);
    expect(ratio(screen.getByRole("slider"))).toBe("0.9");
  });

  it("works inside <Field> with errors and size", () => {
    render(
      <Field label="Brightness" error="Too bright">
        <Range size="lg" />
      </Field>,
    );
    const slider = screen.getByRole("slider", { name: "Brightness" });
    expect(slider).toHaveAttribute("aria-invalid", "true");
    const wrapper = slider.closest(".cherry-range");
    expect(wrapper).toHaveAttribute("data-size", "lg");
    expect(wrapper).toHaveAttribute("data-invalid");
  });
});
