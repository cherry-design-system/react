import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Modal, ModalBody, ModalFooter } from "./index";

// jsdom has no showModal/close: a minimal stand-in that toggles [open] and
// fires "close" like the browser.
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

function Harness({
  onClose,
  dismissible,
}: {
  onClose?: () => void;
  dismissible?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <Modal
        open={open}
        onClose={() => {
          onClose?.();
          setOpen(false);
        }}
        dismissible={dismissible}
        title="Delete project?"
        description="This cannot be undone."
        size="sm"
      >
        <ModalBody>Body text</ModalBody>
        <ModalFooter>
          <button type="button">Delete</button>
        </ModalFooter>
      </Modal>
    </>
  );
}

const dialog = () => document.querySelector("dialog") as HTMLDialogElement;

describe("Modal", () => {
  it("opens as a named, described dialog", async () => {
    render(<Harness />);
    expect(dialog()).not.toHaveAttribute("open");
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    const el = screen.getByRole("dialog", { name: "Delete project?" });
    expect(el).toHaveAttribute("open");
    expect(el).toHaveAccessibleDescription("This cannot be undone.");
    expect(el).toHaveClass("cherry-modal");
    expect(el).toHaveAttribute("data-size", "sm");
    expect(screen.getByText("Body text")).toHaveClass("cherry-modal__body");
  });

  it("closes on Escape (cancel) and returns focus to the opener", async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const opener = screen.getByRole("button", { name: "Open" });
    await userEvent.click(opener);
    screen.getByRole("button", { name: "Delete" }).focus();
    fireEvent(dialog(), new Event("cancel", { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(dialog()).not.toHaveAttribute("open");
    expect(opener).toHaveFocus();
  });

  it("closes from the close button", async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(dialog()).not.toHaveAttribute("open");
  });

  it("closes on a backdrop click, not on a click inside", async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    fireEvent.click(screen.getByText("Body text"));
    expect(onClose).not.toHaveBeenCalled();
    // jsdom lays nothing out: any point is outside the dialog's empty rect.
    fireEvent.pointerDown(dialog(), { clientX: 500, clientY: 500 });
    fireEvent.click(dialog(), { clientX: 500, clientY: 500 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores Escape and backdrop when not dismissible", async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} dismissible={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    fireEvent(dialog(), new Event("cancel", { cancelable: true }));
    fireEvent.pointerDown(dialog(), { clientX: 500, clientY: 500 });
    fireEvent.click(dialog(), { clientX: 500, clientY: 500 });
    expect(onClose).not.toHaveBeenCalled();
    expect(dialog()).toHaveAttribute("open");
  });
});
