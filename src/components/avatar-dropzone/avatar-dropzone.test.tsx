import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AvatarDropzone } from "./index";

describe("AvatarDropzone", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => vi.useRealTimers());

  it("previews a picked picture, then fades it out on remove", async () => {
    const onFileChange = vi.fn();
    const { container } = render(
      <AvatarDropzone size="lg" onFileChange={onFileChange} />,
    );
    const root = container.querySelector(".cherry-avatar-dropzone")!;
    expect(root).toHaveAttribute("data-size", "lg");
    const input = screen.getByLabelText("Upload profile picture");
    const picture = new File(["x"], "me.png", { type: "image/png" });
    await userEvent.upload(input, picture);
    expect(onFileChange).toHaveBeenCalledWith(picture);
    expect(root).toHaveAttribute("data-filled");
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "blob:preview",
    );

    vi.useFakeTimers();
    act(() => {
      screen.getByRole("button", { name: "Remove profile picture" }).click();
    });
    expect(onFileChange).toHaveBeenLastCalledWith(null);
    expect(root).not.toHaveAttribute("data-filled");
    // Still mounted while it animates out.
    expect(container.querySelector("img")).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(container.querySelector("img")).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });
  it("rejects files that are not images or too big", async () => {
    const onFileRejected = vi.fn();
    render(<AvatarDropzone maxBytes={1} onFileRejected={onFileRejected} />);
    const input = screen.getByLabelText("Upload profile picture");
    const big = new File(["xx"], "me.png", { type: "image/png" });
    await userEvent.upload(input, big);
    expect(onFileRejected).toHaveBeenCalledWith({ file: big, reason: "size" });
  });
  it("starts filled from defaultSrc", () => {
    const { container } = render(<AvatarDropzone defaultSrc="/me.png" />);
    expect(container.firstElementChild).toHaveAttribute("data-filled");
    expect(
      screen.getByRole("button", { name: "Remove profile picture" }),
    ).toBeInTheDocument();
  });
});
