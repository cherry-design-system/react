import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Accordion, AccordionItem } from "./index";

describe("Accordion", () => {
  it("renders native details/summary with the variant", () => {
    const { container } = render(
      <Accordion variant="inline">
        <AccordionItem title="What is cherry?">A design system.</AccordionItem>
      </Accordion>,
    );
    const details = container.querySelector("details");
    expect(details).toHaveAttribute("data-variant", "inline");
    expect(details).not.toHaveAttribute("open");
    expect(container.querySelector("summary")).toHaveTextContent(
      "What is cherry?",
    );
  });

  it("toggles on click (native summary behaviour)", async () => {
    const { container } = render(
      <AccordionItem title="Question">Answer</AccordionItem>,
    );
    const details = container.querySelector("details")!;
    const summary = screen.getByText("Question").closest("summary")!;
    await userEvent.click(summary);
    expect(details.open).toBe(true);
    await userEvent.click(summary);
    expect(details.open).toBe(false);
  });

  it("respects defaultOpen", () => {
    const { container } = render(
      <AccordionItem title="Q" defaultOpen>
        A
      </AccordionItem>,
    );
    expect(container.querySelector("details")).toHaveAttribute("open");
  });

  it("shares a native name across items when type=single", () => {
    const { container } = render(
      <Accordion type="single">
        <AccordionItem title="One">1</AccordionItem>
        <AccordionItem title="Two">2</AccordionItem>
      </Accordion>,
    );
    const [a, b] = Array.from(container.querySelectorAll("details"));
    expect(a!.getAttribute("name")).toBeTruthy();
    expect(a!.getAttribute("name")).toBe(b!.getAttribute("name"));
  });

  it("leaves items independent when type=multiple", () => {
    const { container } = render(
      <Accordion>
        <AccordionItem title="One">1</AccordionItem>
      </Accordion>,
    );
    expect(container.querySelector("details")).not.toHaveAttribute("name");
  });
});
