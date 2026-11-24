import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Field } from "../field";
import { Password } from "./Password";

describe("Password", () => {
  it("hides the value and toggles it with a pressed button", async () => {
    const onVisibleChange = vi.fn();
    render(
      <Field label="Password">
        <Password onVisibleChange={onVisibleChange} />
      </Field>,
    );
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");
    const toggle = screen.getByRole("button", { name: "Show password" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveAttribute("aria-controls", input.id);
    await userEvent.click(toggle);
    expect(input).toHaveAttribute("type", "text");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(onVisibleChange).toHaveBeenCalledWith(true);
  });

  it("does not submit the form when toggled", async () => {
    const onSubmit = vi.fn((e: { preventDefault(): void }) =>
      e.preventDefault(),
    );
    render(
      <form onSubmit={onSubmit}>
        <Password aria-label="Password" />
      </form>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("translates the toggle label and sizes the wrapper", () => {
    render(
      <Password aria-label="Mot de passe" size="lg" toggleLabel="Afficher" />,
    );
    const button = screen.getByRole("button", { name: "Afficher" });
    expect(button.closest(".cherry-password")).toHaveAttribute(
      "data-size",
      "lg",
    );
  });

  it("disables the toggle with the field and shows errors", () => {
    render(
      <Field label="Password" error="Wrong password" disabled>
        <Password />
      </Field>,
    );
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
