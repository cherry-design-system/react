import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Popover } from "./index";

describe("Popover", () => {
  it("renders a native auto popover linked to its trigger", () => {
    render(
      <>
        <button type="button" popoverTarget="share">
          Share
        </button>
        <Popover
          id="share"
          title="Share preview"
          placement="top"
          align="end"
          actions={<button type="button">Copy link</button>}
        >
          Anyone with the link can view it.
        </Popover>
      </>,
    );
    expect(screen.getByRole("button", { name: "Share" })).toHaveAttribute(
      "popovertarget",
      "share",
    );
    const panel = document.getElementById("share")!;
    expect(panel).toHaveAttribute("popover", "auto");
    expect(panel).toHaveAttribute("role", "dialog");
    expect(panel).toHaveAttribute("data-placement", "top");
    expect(panel).toHaveAttribute("data-align", "end");
    // Closed popovers are display:none, so check the wiring, not the name.
    const title = document.getElementById(
      panel.getAttribute("aria-labelledby")!,
    );
    expect(title).toHaveTextContent("Share preview");
    expect(panel.querySelector(".cherry-popover__actions")).not.toBeNull();
  });

  it("defaults to bottom / center and supports manual mode", () => {
    render(
      <Popover id="p" mode="manual">
        Body
      </Popover>,
    );
    const panel = document.getElementById("p")!;
    expect(panel).toHaveAttribute("popover", "manual");
    expect(panel).toHaveAttribute("data-placement", "bottom");
    expect(panel).toHaveAttribute("data-align", "center");
    expect(panel).not.toHaveAttribute("role");
  });
});
