import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Sidebar, SidebarGroup, SidebarItem } from "./index";

describe("Sidebar", () => {
  it("renders an aside with a named nav, groups and items", () => {
    render(
      <Sidebar navLabel="App" header={<span>cherry</span>} footer="Ada">
        <SidebarGroup label="Workspace">
          <SidebarItem href="/" icon={<svg />} active>
            Home
          </SidebarItem>
          <SidebarItem href="/inbox" badge="3">
            Inbox
          </SidebarItem>
        </SidebarGroup>
      </Sidebar>,
    );
    expect(screen.getByRole("complementary")).toHaveClass("cherry-sidebar");
    expect(screen.getByRole("navigation", { name: "App" })).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Workspace" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    const inbox = screen.getByRole("link", { name: /Inbox/ });
    expect(inbox.querySelector(".cherry-sidebar__badge")).toHaveTextContent(
      "3",
    );
  });

  it("marks the collapsed rail and keeps names", () => {
    render(
      <Sidebar collapsed>
        <SidebarGroup>
          <SidebarItem href="/">Home</SidebarItem>
        </SidebarGroup>
      </Sidebar>,
    );
    expect(screen.getByRole("complementary")).toHaveAttribute("data-collapsed");
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
  });

  it("folds a collapsible group with a native disclosure", async () => {
    const { container } = render(
      <SidebarGroup label="Resources" collapsible>
        <SidebarItem href="/docs">Docs</SidebarItem>
      </SidebarGroup>,
    );
    const details = container.querySelector("details")!;
    expect(details.open).toBe(true);
    await userEvent.click(screen.getByText("Resources"));
    expect(details.open).toBe(false);
  });

  it("renders a button item without href", async () => {
    const onClick = vi.fn();
    render(
      <SidebarGroup>
        <SidebarItem onClick={onClick} active>
          Settings
        </SidebarItem>
      </SidebarGroup>,
    );
    const button = screen.getByRole("button", { name: "Settings" });
    expect(button).toHaveAttribute("aria-current", "true");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalled();
  });
});
