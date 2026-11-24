import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CodeBlock } from "./index";

const code = `import { Button } from "@cherry-design-system/react";\n\nexport function Save() {}\n`;

describe("CodeBlock", () => {
  it("renders lines, highlights and header", () => {
    const { container } = render(
      <CodeBlock
        code={code}
        filename="save.tsx"
        language="tsx"
        highlightLines={[3]}
      />,
    );
    const lines = container.querySelectorAll(".cherry-code-block__line");
    expect(lines).toHaveLength(3);
    expect(lines[2]).toHaveAttribute("data-highlighted");
    expect(lines[0]).not.toHaveAttribute("data-highlighted");
    expect(container.firstElementChild).toHaveAttribute("data-line-numbers");
    expect(screen.getByText("save.tsx")).toBeInTheDocument();
    expect(screen.getByText("tsx")).toBeInTheDocument();
    // Line numbers come from CSS, never from the text.
    expect(container.querySelector("code")!.textContent).toBe(
      code.replace(/\n/g, ""),
    );
  });
  it("copies the code and confirms", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(<CodeBlock code={code} />);
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "Copy code" }));
    });
    expect(writeText).toHaveBeenCalledWith(code);
    expect(screen.getByRole("button", { name: "Copied" })).toHaveAttribute(
      "data-copied",
    );
  });
  it("can drop the header and line numbers", () => {
    const { container } = render(
      <CodeBlock code="x" copyable={false} lineNumbers={false} />,
    );
    expect(container.querySelector(".cherry-code-block__header")).toBeNull();
    expect(container.firstElementChild).not.toHaveAttribute(
      "data-line-numbers",
    );
  });
});
