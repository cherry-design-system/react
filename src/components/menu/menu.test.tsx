import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { MenuItem } from "../menu-item";
import { Menu, MenuGroup, MenuSeparator } from "./index";

// jsdom has no popover API (and treats [popover] content as unfocusable): a
// minimal stand-in that lifts the attribute while "open", fires "toggle"
// like the browser and honours popovertarget.
beforeAll(() => {
  if ("showPopover" in HTMLElement.prototype) return;
  const isOpen = (el: HTMLElement) => el.hasAttribute("data-test-open");
  const set = (el: HTMLElement, open: boolean) => {
    if (isOpen(el) === open) return;
    el.toggleAttribute("data-test-open", open);
    if (open) {
      el.dataset.testPopover = el.getAttribute("popover") ?? "";
      el.removeAttribute("popover");
    } else {
      el.setAttribute("popover", el.dataset.testPopover ?? "auto");
    }
    const event = new Event("toggle");
    Object.assign(event, {
      newState: open ? "open" : "closed",
      oldState: open ? "closed" : "open",
    });
    el.dispatchEvent(event);
  };
  Object.assign(HTMLElement.prototype, {
    showPopover(this: HTMLElement) {
      set(this, true);
    },
    hidePopover(this: HTMLElement) {
      set(this, false);
    },
    togglePopover(this: HTMLElement) {
      set(this, !isOpen(this));
    },
  });
  document.addEventListener("click", (event) => {
    const invoker = (event.target as Element).closest?.("[popovertarget]");
    const id = invoker?.getAttribute("popovertarget");
    const target = id ? document.getElementById(id) : null;
    if (target) set(target, !isOpen(target));
  });
});

function setup(onCopy = vi.fn(), onDelete = vi.fn()) {
  render(
    <Menu trigger={<button type="button">Options</button>}>
      <MenuGroup label="Project">
        <MenuItem onClick={onCopy} shortcut="⌘C">
          Copy link
        </MenuItem>
        <MenuItem>Duplicate</MenuItem>
        <MenuItem disabled>Archive</MenuItem>
        <MenuItem>Share</MenuItem>
      </MenuGroup>
      <MenuSeparator />
      <MenuItem variant="danger" onClick={onDelete}>
        Delete
      </MenuItem>
    </Menu>,
  );
  const trigger = screen.getByRole("button", { name: "Options" });
  const menu = screen.getByRole("menu", { hidden: true });
  const item = (name: string) =>
    screen.getByRole("menuitem", { name, hidden: true });
  return { trigger, menu, item, onCopy, onDelete };
}

describe("Menu", () => {
  it("wires the trigger to a popover menu", () => {
    const { trigger, menu } = setup();
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-controls", menu.id);
    expect(trigger).toHaveAttribute("popovertarget", menu.id);
    expect(menu).toHaveAttribute("popover", "auto");
    expect(menu).toHaveAttribute("aria-labelledby", trigger.id);
    expect(menu).toHaveAttribute("data-placement", "bottom");
    expect(menu).toHaveAttribute("data-align", "start");
  });

  it("opens on click and focuses the first item", async () => {
    const { trigger, menu, item } = setup();
    await userEvent.click(trigger);
    expect(menu).toHaveAttribute("data-test-open");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(item("Copy link")).toHaveFocus();
  });

  it("moves with arrows, Home/End and typeahead, skipping disabled items", async () => {
    const { trigger, item } = setup();
    await userEvent.click(trigger);
    await userEvent.keyboard("{ArrowDown}");
    expect(item("Duplicate")).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(item("Share")).toHaveFocus(); // Archive is disabled
    await userEvent.keyboard("{End}");
    expect(item("Delete")).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(item("Copy link")).toHaveFocus(); // wraps
    await userEvent.keyboard("{ArrowUp}");
    expect(item("Delete")).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(item("Copy link")).toHaveFocus();
    await userEvent.keyboard("s");
    expect(item("Share")).toHaveFocus();
  });

  it("opens from the keyboard on ArrowUp at the last item", () => {
    const { trigger, item } = setup();
    act(() => trigger.focus());
    fireEvent.keyDown(trigger, { key: "ArrowUp" });
    expect(item("Delete")).toHaveFocus();
  });

  it("Escape closes and returns focus to the trigger", async () => {
    const { trigger, menu } = setup();
    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");
    expect(menu).not.toHaveAttribute("data-test-open");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("choosing an item runs it and closes; disabled items do nothing", async () => {
    const { trigger, menu, item, onDelete } = setup();
    await userEvent.click(trigger);
    fireEvent.click(item("Archive"));
    expect(menu).toHaveAttribute("data-test-open");
    await userEvent.click(item("Delete"));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(menu).not.toHaveAttribute("data-test-open");
    expect(trigger).toHaveFocus();
  });

  it("renders item parts, variants and the group label", () => {
    const { item } = setup();
    expect(item("Delete")).toHaveAttribute("data-variant", "danger");
    expect(item("Archive")).toHaveAttribute("aria-disabled", "true");
    expect(
      item("Copy link").querySelector(".cherry-menu-item__shortcut")?.tagName,
    ).toBe("KBD");
    expect(
      screen.getByRole("group", { name: "Project", hidden: true }),
    ).toBeInTheDocument();
    expect(screen.getByRole("separator", { hidden: true })).toBeInTheDocument();
  });
});
