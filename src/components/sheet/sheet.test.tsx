import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Sheet, SheetBody, SheetFooter } from "./index";

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

describe("Sheet", () => {
  it("opens from its side as a named dialog with parts", () => {
    render(
      <Sheet open onClose={() => {}} side="left" title="Edit profile">
        <SheetBody>Fields</SheetBody>
        <SheetFooter>Actions</SheetFooter>
      </Sheet>,
    );
    const dialog = screen.getByRole("dialog", { name: "Edit profile" });
    expect(dialog).toHaveAttribute("open");
    expect(dialog).toHaveAttribute("data-side", "left");
    expect(screen.getByText("Fields")).toHaveClass("cherry-sheet__body");
    expect(screen.getByText("Actions")).toHaveClass("cherry-sheet__footer");
    expect(dialog.querySelector(".cherry-sheet__handle")).toBeNull();
  });

  it("shows a drag handle on the bottom side", () => {
    render(
      <Sheet open onClose={() => {}} side="bottom" title="Filters">
        <SheetBody>x</SheetBody>
      </Sheet>,
    );
    expect(
      screen.getByRole("dialog").querySelector(".cherry-sheet__handle"),
    ).toHaveAttribute("aria-hidden", "true");
  });

  it("asks to close on Escape and the close button", () => {
    const onClose = vi.fn();
    render(
      <Sheet open onClose={onClose} title="Edit" closeLabel="Dismiss">
        <SheetBody>x</SheetBody>
      </Sheet>,
    );
    fireEvent(
      screen.getByRole("dialog"),
      new Event("cancel", { cancelable: true }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("closes the native dialog when open turns false", () => {
    const { rerender } = render(<Sheet open onClose={() => {}} title="Edit" />);
    rerender(<Sheet open={false} onClose={() => {}} title="Edit" />);
    expect(document.querySelector("dialog")).not.toHaveAttribute("open");
  });
});
