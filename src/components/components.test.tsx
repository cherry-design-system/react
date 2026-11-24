import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button, Field, Input, ThemeToggle, Toggle, ToastProvider, Toaster, useToast } from "../index";

describe("Button", () => {
  it("renders variants as data attributes and defaults type=button", () => {
    render(<Button variant="outline" size="lg">Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("data-variant", "outline");
    expect(button).toHaveAttribute("data-size", "lg");
  });
  it("blocks clicks while loading", async () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });
});

describe("Field + Input", () => {
  it("wires label, error and aria", () => {
    render(
      <Field label="Email" error="Required">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Required");
  });
});

describe("Toggle", () => {
  it("is a native switch", async () => {
    render(<Toggle label="Wi-Fi" />);
    const toggle = screen.getByRole("switch", { name: "Wi-Fi" });
    await userEvent.click(toggle);
    expect(toggle).toBeChecked();
  });
});

describe("ThemeToggle", () => {
  it("offers System first and switches mode", async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    render(<ThemeToggle />);
    const radios = screen.getAllByRole("radio");
    expect(radios.map((r) => r.getAttribute("aria-label"))).toEqual(["System", "Light", "Dark"]);
    await userEvent.click(screen.getByRole("radio", { name: "Dark" }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});

describe("Toast", () => {
  it("shows, then dismisses with an exit animation", async () => {
    vi.useFakeTimers();
    let api: ReturnType<typeof useToast> | undefined;
    function Grab() {
      api = useToast();
      return null;
    }
    render(
      <ToastProvider>
        <Grab />
        <Toaster />
      </ToastProvider>,
    );
    let id = -1;
    act(() => {
      id = api!.show("Saved", { color: "success", description: "All good" });
    });
    expect(screen.getByText("Saved")).toBeInTheDocument();
    act(() => api!.dismiss(id));
    expect(screen.getByText("Saved").closest("li")).toHaveAttribute("data-exiting");
    act(() => vi.advanceTimersByTime(400));
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    vi.useRealTimers();
  });
  it("swaps a promise toast in place", async () => {
    let api: ReturnType<typeof useToast> | undefined;
    function Grab() {
      api = useToast();
      return null;
    }
    render(
      <ToastProvider>
        <Grab />
        <Toaster />
      </ToastProvider>,
    );
    let finish: (value: number) => void = () => undefined;
    const task = new Promise<number>((r) => (finish = r));
    act(() => {
      void api!.promise(task, { loading: "Saving", success: "Saved", error: "Failed" });
    });
    expect(screen.getByText("Saving").closest("li")).toHaveAttribute("data-color", "loading");
    await act(async () => {
      finish(1);
      await task;
    });
    const item = screen.getByText("Saved").closest("li");
    expect(item).toHaveAttribute("data-color", "success");
    expect(item?.querySelector(".cherry-toast__tile")).toHaveAttribute("data-settled");
  });
});
