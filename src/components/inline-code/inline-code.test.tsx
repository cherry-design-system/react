import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InlineCode } from "./index";

describe("InlineCode", () => {
  it("renders a code element", () => {
    const { container } = render(<InlineCode>useColorMode()</InlineCode>);
    const code = container.firstElementChild!;
    expect(code.tagName).toBe("CODE");
    expect(code).toHaveClass("cherry-inline-code");
    expect(code).toHaveTextContent("useColorMode()");
  });
});
