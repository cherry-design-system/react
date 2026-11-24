import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Field } from "../field";
import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("renders a textbox with rows and auto-resize on by default", () => {
    render(<Textarea aria-label="Message" />);
    const box = screen.getByRole("textbox", { name: "Message" });
    expect(box.tagName).toBe("TEXTAREA");
    expect(box).toHaveAttribute("rows", "4");
    const wrapper = box.closest(".cherry-textarea");
    expect(wrapper).toHaveAttribute("data-auto-resize");
    expect(wrapper).toHaveAttribute("data-size", "md");
  });

  it("can opt out of auto-resize", () => {
    render(<Textarea aria-label="Notes" autoResize={false} />);
    expect(
      screen.getByRole("textbox").closest(".cherry-textarea"),
    ).not.toHaveAttribute("data-auto-resize");
  });

  it("counts characters against maxLength and describes the field", async () => {
    render(<Textarea aria-label="Bio" showCount maxLength={5} />);
    const box = screen.getByRole("textbox");
    await userEvent.type(box, "hey");
    expect(screen.getByText("3/5")).toBeInTheDocument();
    expect(box).toHaveAccessibleDescription("3 of 5 characters");
    await userEvent.type(box, "yo!");
    expect(screen.getByText("5/5").parentElement).toHaveAttribute("data-limit");
  });

  it("joins the Field hint and the count in its description", () => {
    render(
      <Field label="Bio" hint="Keep it short">
        <Textarea showCount defaultValue="hi" />
      </Field>,
    );
    expect(screen.getByLabelText("Bio")).toHaveAccessibleDescription(
      "Keep it short 2 characters",
    );
  });

  it("is invalid inside an erroring Field", () => {
    render(
      <Field label="Bio" error="Too long">
        <Textarea />
      </Field>,
    );
    const box = screen.getByLabelText("Bio");
    expect(box).toHaveAttribute("aria-invalid", "true");
    expect(box.closest(".cherry-textarea")).toHaveAttribute("data-invalid");
  });
});
