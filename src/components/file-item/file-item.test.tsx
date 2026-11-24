import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FileItem, formatBytes } from "./index";

describe("FileItem", () => {
  afterEach(() => vi.useRealTimers());

  it("shows progress while uploading", () => {
    const { container } = render(
      <FileItem
        name="brand.pdf"
        bytes={2_400_000}
        status="uploading"
        progress={64}
      />,
    );
    const bar = screen.getByRole("progressbar", { name: "brand.pdf" });
    expect(bar).toHaveAttribute("aria-valuenow", "64");
    expect(container.firstElementChild).toHaveAttribute(
      "data-status",
      "uploading",
    );
    expect(container.firstElementChild).toHaveTextContent("2.4 MB · 64%");
  });
  it("announces errors", () => {
    render(<FileItem name="a.pdf" status="error" error="File is over 10 MB" />);
    expect(screen.getByRole("alert")).toHaveTextContent("File is over 10 MB");
  });
  it("animates out before calling onRemove", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    vi.useFakeTimers();
    const onRemove = vi.fn();
    const { container } = render(
      <FileItem name="a.pdf" bytes={10} onRemove={onRemove} />,
    );
    act(() => screen.getByRole("button", { name: "Remove a.pdf" }).click());
    expect(container.firstElementChild).toHaveAttribute("data-removing");
    expect(onRemove).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
  it("removes at once under reduced motion", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const onRemove = vi.fn();
    render(<FileItem name="a.pdf" onRemove={onRemove} />);
    act(() => screen.getByRole("button", { name: "Remove a.pdf" }).click());
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
  it("formats bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2_400_000)).toBe("2.4 MB");
    expect(formatBytes(1_000)).toBe("1 KB");
    expect(formatBytes(150_000)).toBe("150 KB");
  });
});
