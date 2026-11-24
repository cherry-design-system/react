import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Field } from "../field";
import { Combobox } from "./Combobox";

// jsdom has no popover API: a minimal stand-in that tracks the open state.
// (jsdom still hides [popover] content, so option queries pass hidden: true.)
const open = new WeakSet<Element>();
const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
const realMatches = Element.prototype.matches;
beforeAll(() => {
  proto.showPopover = function (this: Element) {
    open.add(this);
  };
  proto.hidePopover = function (this: Element) {
    open.delete(this);
  };
  Element.prototype.matches = function (this: Element, selector: string) {
    if (selector === ":popover-open") return open.has(this);
    return realMatches.call(this, selector);
  } as typeof realMatches;
});
afterAll(() => {
  delete proto.showPopover;
  delete proto.hidePopover;
  Element.prototype.matches = realMatches;
});

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "nest", label: "NestJS" },
  { value: "netlify", label: "Netlify Functions" },
  { value: "remix", label: "Remix", disabled: true },
  { value: "astro", label: "Astro" },
];

const popoverOf = () =>
  document.querySelector(".cherry-combobox__popover") as HTMLElement;

describe("Combobox", () => {
  it("follows the ARIA combobox pattern", () => {
    render(<Combobox aria-label="Framework" options={frameworks} />);
    const input = screen.getByRole("combobox", { name: "Framework" });
    const listbox = screen.getByRole("listbox", { hidden: true });
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).toHaveAttribute("aria-controls", listbox.id);
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(popoverOf()).toHaveAttribute("popover", "manual");
  });

  it("filters while typing and announces the count", async () => {
    render(<Combobox aria-label="Framework" options={frameworks} />);
    const input = screen.getByRole("combobox");
    await userEvent.type(input, "ne");
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(open.has(popoverOf())).toBe(true);
    const names = screen
      .getAllByRole("option", { hidden: true })
      .map((o) => o.textContent);
    expect(names).toEqual(["Next.js", "NestJS", "Netlify Functions"]);
    expect(screen.getByText("3 results")).toBeInTheDocument();
  });

  it("moves with arrows (skipping disabled), selects with Enter", async () => {
    const onValueChange = vi.fn();
    render(
      <Combobox
        aria-label="Framework"
        options={frameworks}
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole("combobox");
    input.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}");
    const active = document.getElementById(
      input.getAttribute("aria-activedescendant")!,
    );
    expect(active).toHaveTextContent("Astro");
    expect(active).toHaveAttribute("data-active");
    await userEvent.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("astro");
    expect(input).toHaveValue("Astro");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(open.has(popoverOf())).toBe(false);
  });

  it("marks the selected option and closes with Escape, restoring the text", async () => {
    render(
      <Combobox
        aria-label="Framework"
        options={frameworks}
        defaultValue="nest"
      />,
    );
    const input = screen.getByRole("combobox");
    expect(input).toHaveValue("NestJS");
    await userEvent.click(input);
    expect(
      screen.getByRole("option", { name: "NestJS", hidden: true }),
    ).toHaveAttribute("aria-selected", "true");
    await userEvent.type(input, "xyz");
    expect(screen.getByText("No results found")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).toHaveValue("NestJS");
  });

  it("selects on click and submits the value", async () => {
    const { container } = render(
      <form>
        <Combobox aria-label="Framework" name="fw" options={frameworks} />
      </form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Show options" }));
    await userEvent.click(
      screen.getByRole("option", { name: "Netlify Functions", hidden: true }),
    );
    expect(screen.getByRole("combobox")).toHaveValue("Netlify Functions");
    expect(container.querySelector('input[name="fw"]')).toHaveValue("netlify");
  });

  it("shows a custom empty state", async () => {
    render(
      <Combobox
        aria-label="Framework"
        options={frameworks}
        emptyMessage="No frameworks found"
        emptyHint="Try another search."
      />,
    );
    await userEvent.type(screen.getByRole("combobox"), "zzz");
    expect(screen.getByText("No frameworks found")).toBeInTheDocument();
    expect(screen.getByText("Try another search.")).toBeInTheDocument();
    expect(screen.getByText("0 results")).toBeInTheDocument();
  });

  it("works inside <Field>", () => {
    render(
      <Field label="Framework" error="Pick one">
        <Combobox options={frameworks} size="sm" />
      </Field>,
    );
    const input = screen.getByRole("combobox", { name: "Framework" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Pick one");
    expect(input.closest(".cherry-combobox")).toHaveAttribute(
      "data-size",
      "sm",
    );
  });
});
