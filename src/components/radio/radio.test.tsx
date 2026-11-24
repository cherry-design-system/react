import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Field } from "../field";
import { Radio, RadioGroup } from "./Radio";

function Plans(props: { onValueChange?: (v: string) => void }) {
  return (
    <RadioGroup aria-label="Plan" defaultValue="pro" {...props}>
      <Radio value="free" label="Free" />
      <Radio value="pro" label="Pro" />
      <Radio value="team" label="Team" disabled />
    </RadioGroup>
  );
}

describe("RadioGroup + Radio", () => {
  it("renders a named radiogroup with one shared name", () => {
    render(<Plans />);
    const group = screen.getByRole("radiogroup", { name: "Plan" });
    expect(group).toHaveAttribute("data-orientation", "vertical");
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    const names = new Set(radios.map((r) => r.getAttribute("name")));
    expect(names.size).toBe(1);
    expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();
  });

  it("selects on click and reports the value", async () => {
    const onValueChange = vi.fn();
    render(<Plans onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("radio", { name: "Free" }));
    expect(screen.getByRole("radio", { name: "Free" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Pro" })).not.toBeChecked();
    expect(onValueChange).toHaveBeenCalledWith("free");
  });

  it("moves with arrow keys", async () => {
    render(<Plans />);
    screen.getByRole("radio", { name: "Pro" }).focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(screen.getByRole("radio", { name: "Free" })).toBeChecked();
  });

  it("works controlled", async () => {
    function Controlled() {
      const [v, setV] = useState<string | null>("free");
      return (
        <>
          <RadioGroup aria-label="Plan" value={v} onValueChange={setV}>
            <Radio value="free" label="Free" />
            <Radio value="pro" label="Pro" />
          </RadioGroup>
          <output>{v}</output>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole("radio", { name: "Pro" }));
    expect(screen.getByRole("status")).toHaveTextContent("pro");
  });

  it("passes size, disabled and the Field error to every radio", () => {
    render(
      <Field label="Plan" error="Pick one">
        <RadioGroup size="sm" disabled>
          <Radio value="a" label="A" />
        </RadioGroup>
      </Field>,
    );
    const group = screen.getByRole("radiogroup");
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group).toHaveAccessibleDescription("Pick one");
    const radio = screen.getByRole("radio", { name: "A" });
    expect(radio).toBeDisabled();
    const label = radio.closest(".cherry-radio");
    expect(label).toHaveAttribute("data-size", "sm");
    expect(label).toHaveAttribute("data-invalid");
  });
});
