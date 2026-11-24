import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Field } from "../field";
import { Dropzone, matchesAccept } from "./index";

const file = (name: string, type: string, size = 10) =>
  new File(["x".repeat(size)], name, { type });

describe("Dropzone", () => {
  it("is a real, labelled, focusable file input", async () => {
    render(<Dropzone hint="PNG up to 5 MB" />);
    const input = screen.getByLabelText(/Click to upload/);
    expect(input).toHaveAttribute("type", "file");
    await userEvent.tab();
    expect(input).toHaveFocus();
  });
  it("reports accepted and rejected picks", async () => {
    const added = vi.fn();
    const rejected = vi.fn();
    render(
      <Dropzone
        accept="image/*"
        multiple
        maxBytes={100}
        onFilesAdded={added}
        onFilesRejected={rejected}
      />,
    );
    const input = screen.getByLabelText(/Click to upload/) as HTMLInputElement;
    const ok = file("a.png", "image/png");
    const big = file("b.png", "image/png", 500);
    const pdf = file("c.pdf", "application/pdf");
    await userEvent.upload(input, [ok, big, pdf], { applyAccept: false });
    expect(added).toHaveBeenCalledWith([ok]);
    expect(rejected).toHaveBeenCalledWith([
      { file: big, reason: "size" },
      { file: pdf, reason: "type" },
    ]);
  });
  it("shows the drag-over state and takes dropped files", () => {
    const added = vi.fn();
    const { container } = render(<Dropzone onFilesAdded={added} />);
    const zone = container.querySelector(".cherry-dropzone")!;
    fireEvent.dragEnter(zone);
    expect(zone).toHaveAttribute("data-drag-over");
    const dropped = file("a.txt", "text/plain");
    fireEvent.drop(zone, { dataTransfer: { files: [dropped] } });
    expect(zone).not.toHaveAttribute("data-drag-over");
    expect(added).toHaveBeenCalledWith([dropped]);
    expect(container.querySelector("[data-dropped]")).not.toBeNull();
  });
  it("keeps one file without multiple, and ignores drops when disabled", () => {
    const added = vi.fn();
    const rejected = vi.fn();
    const { container, rerender } = render(
      <Dropzone onFilesAdded={added} onFilesRejected={rejected} />,
    );
    const zone = container.querySelector(".cherry-dropzone")!;
    const a = file("a.txt", "text/plain");
    const b = file("b.txt", "text/plain");
    fireEvent.drop(zone, { dataTransfer: { files: [a, b] } });
    expect(added).toHaveBeenCalledWith([a]);
    expect(rejected).toHaveBeenCalledWith([{ file: b, reason: "count" }]);
    rerender(<Dropzone disabled onFilesAdded={added} />);
    fireEvent.dragEnter(zone);
    expect(zone).not.toHaveAttribute("data-drag-over");
    expect(zone).toHaveAttribute("data-disabled");
  });
  it("works inside Field", () => {
    render(
      <Field label="Attachments" error="Required">
        <Dropzone />
      </Field>,
    );
    const input = screen.getByLabelText(/Attachments/);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.closest(".cherry-dropzone")).toHaveAttribute("data-invalid");
  });
  it("matches accept strings like the native picker", () => {
    expect(matchesAccept(file("a.PDF", ""), ".pdf")).toBe(true);
    expect(matchesAccept(file("a", "image/jpeg"), "image/*")).toBe(true);
    expect(matchesAccept(file("a", "text/plain"), "image/*,.pdf")).toBe(false);
    expect(matchesAccept(file("a", "text/plain"))).toBe(true);
  });
});
