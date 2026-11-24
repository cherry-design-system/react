import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { SearchResult } from "../search-result";
import { SearchDialog, SearchGroup } from "./index";

// jsdom has no showModal/close: a minimal stand-in.
beforeAll(() => {
  const proto = HTMLDialogElement.prototype;
  if (!proto.showModal) {
    proto.showModal = function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
    proto.close = function (this: HTMLDialogElement) {
      if (!this.hasAttribute("open")) return;
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  }
});

const ITEMS = [
  { group: "Form", name: "Button" },
  { group: "Form", name: "Input" },
  { group: "Feedback", name: "Toast" },
  { group: "Feedback", name: "Modal" },
];

function Palette({
  onSelect,
  onClose = () => {},
}: {
  onSelect: (name: string) => void;
  onClose?: () => void;
}) {
  const [query, setQuery] = useState("");
  const hits = ITEMS.filter((i) =>
    i.name.toLowerCase().includes(query.toLowerCase()),
  );
  const groups = [...new Set(hits.map((i) => i.group))];
  return (
    <SearchDialog
      open
      onClose={onClose}
      query={query}
      onQueryChange={setQuery}
      placeholder="Search components"
      label="Search components"
      status={`${hits.length} of ${ITEMS.length}`}
      empty={<p>No results for “{query}”</p>}
    >
      {groups.map((group) => (
        <SearchGroup key={group} label={group}>
          {hits
            .filter((i) => i.group === group)
            .map((i) => (
              <SearchResult key={i.name} onSelect={() => onSelect(i.name)}>
                {i.name}
              </SearchResult>
            ))}
        </SearchGroup>
      ))}
    </SearchDialog>
  );
}

describe("SearchDialog", () => {
  it("is a dialog with a combobox over a grouped listbox", () => {
    render(<Palette onSelect={() => {}} />);
    const dialog = screen.getByRole("dialog", { name: "Search components" });
    expect(dialog).toHaveAttribute("open");
    expect(dialog).toHaveAttribute("data-layout", "list");
    const input = screen.getByRole("combobox", { name: "Search components" });
    expect(input).toHaveFocus();
    const listbox = screen.getByRole("listbox");
    expect(input).toHaveAttribute("aria-controls", listbox.id);
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("group", { name: "Form" })).toBeInTheDocument();
    expect(screen.getByText("4 of 4")).toHaveAttribute("aria-live", "polite");
  });

  it("highlights the first result and moves with the arrow keys", async () => {
    render(<Palette onSelect={() => {}} />);
    const input = screen.getByRole("combobox");
    const option = (name: string) => screen.getByRole("option", { name });
    expect(input).toHaveAttribute("aria-activedescendant", option("Button").id);
    expect(option("Button")).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", option("Toast").id);
    expect(option("Toast")).toHaveAttribute("data-active");
    expect(option("Button")).toHaveAttribute("aria-selected", "false");
    await userEvent.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}");
    expect(input).toHaveAttribute("aria-activedescendant", option("Modal").id);
  });

  it("Enter selects the highlighted result; click and hover work too", async () => {
    const onSelect = vi.fn();
    render(<Palette onSelect={onSelect} />);
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenLastCalledWith("Input");
    fireEvent.pointerMove(screen.getByRole("option", { name: "Modal" }));
    expect(screen.getByRole("option", { name: "Modal" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await userEvent.click(screen.getByRole("option", { name: "Toast" }));
    expect(onSelect).toHaveBeenLastCalledWith("Toast");
  });

  it("filters, re-highlights the first match and shows the empty state", async () => {
    render(<Palette onSelect={() => {}} />);
    const input = screen.getByRole("combobox");
    await userEvent.type(input, "toa");
    expect(input).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Toast" }).id,
    );
    await userEvent.type(input, "zzz");
    expect(screen.getByText("No results for “toazzz”")).toBeInTheDocument();
    expect(input).not.toHaveAttribute("aria-activedescendant");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("asks to close on Escape", () => {
    const onClose = vi.fn();
    render(<Palette onSelect={() => {}} onClose={onClose} />);
    fireEvent(
      screen.getByRole("dialog"),
      new Event("cancel", { cancelable: true }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
