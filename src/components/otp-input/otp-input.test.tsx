import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Field } from "../field";
import { OTPInput } from "./OTPInput";

const slots = () => screen.getAllByRole("textbox");

describe("OTPInput", () => {
  it("renders N labelled slots in a group", () => {
    render(<OTPInput aria-label="Verification code" length={4} />);
    expect(
      screen.getByRole("group", { name: "Verification code" }),
    ).toBeInTheDocument();
    expect(slots()).toHaveLength(4);
    expect(slots()[0]).toHaveAccessibleName("Character 1 of 4");
    expect(slots()[0]).toHaveAttribute("autocomplete", "one-time-code");
  });

  it("advances while typing, ignores invalid characters and completes", async () => {
    const onComplete = vi.fn();
    const onValueChange = vi.fn();
    render(
      <OTPInput
        aria-label="Code"
        length={4}
        onComplete={onComplete}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(slots()[0]!);
    await userEvent.keyboard("1a2");
    expect(onValueChange).toHaveBeenLastCalledWith("12");
    expect(slots()[2]).toHaveFocus();
    await userEvent.keyboard("34");
    expect(onComplete).toHaveBeenCalledWith("1234");
    expect(slots().map((s) => (s as HTMLInputElement).value)).toEqual([
      "1",
      "2",
      "3",
      "4",
    ]);
  });

  it("moves back with Backspace", async () => {
    render(<OTPInput aria-label="Code" length={4} defaultValue="12" />);
    await userEvent.click(slots()[2]!);
    await userEvent.keyboard("{Backspace}");
    expect(slots()[1]).toHaveFocus();
    expect((slots()[1] as HTMLInputElement).value).toBe("");
    expect((slots()[0] as HTMLInputElement).value).toBe("1");
  });

  it("fills every slot on paste", async () => {
    const onComplete = vi.fn();
    render(<OTPInput aria-label="Code" onComplete={onComplete} />);
    await userEvent.click(slots()[0]!);
    await userEvent.paste("428 915");
    expect(onComplete).toHaveBeenCalledWith("428915");
    expect(slots()[5]).toHaveFocus();
  });

  it("distributes an autofilled code from the first slot", () => {
    const onComplete = vi.fn();
    render(<OTPInput aria-label="Code" length={4} onComplete={onComplete} />);
    fireEvent.change(slots()[0]!, { target: { value: "9876" } });
    expect(onComplete).toHaveBeenCalledWith("9876");
  });

  it("moves with arrows and keeps one tab stop", async () => {
    render(<OTPInput aria-label="Code" length={4} defaultValue="123" />);
    const tabbable = slots().filter((s) => s.tabIndex === 0);
    expect(tabbable).toEqual([slots()[3]]);
    await userEvent.click(slots()[3]!);
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(slots()[1]).toHaveFocus();
  });

  it("renders the middle separator variant and submits a hidden value", () => {
    const { container } = render(
      <OTPInput aria-label="Code" separator name="otp" defaultValue="42" />,
    );
    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("data-separator");
    const sep = container.querySelector(".cherry-otp-input__separator");
    expect(sep?.previousElementSibling?.querySelector("input")).toBe(
      slots()[2],
    );
    expect(
      container.querySelector('input[type="hidden"][name="otp"]'),
    ).toHaveValue("42");
  });

  it("is invalid and disabled from <Field>", () => {
    render(
      <Field label="Code" error="Expired code" disabled>
        <OTPInput length={4} />
      </Field>,
    );
    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("data-invalid");
    for (const slot of slots()) {
      expect(slot).toBeDisabled();
      expect(slot).toHaveAttribute("aria-invalid", "true");
      expect(slot).toHaveAccessibleDescription("Expired code");
    }
  });
});
