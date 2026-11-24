import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tab, TabList, TabPanel, Tabs } from "./index";

function Example(props: { onValueChange?: (v: string) => void }) {
  return (
    <Tabs defaultValue="overview" {...props}>
      <TabList aria-label="Project">
        <Tab value="overview">Overview</Tab>
        <Tab value="details">Details</Tab>
        <Tab value="archived" disabled>
          Archived
        </Tab>
        <Tab value="settings">Settings</Tab>
      </TabList>
      <TabPanel value="overview">Overview panel</TabPanel>
      <TabPanel value="details">Details panel</TabPanel>
      <TabPanel value="archived">Archived panel</TabPanel>
      <TabPanel value="settings">Settings panel</TabPanel>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("wires tablist, tabs and panels", () => {
    render(<Example />);
    expect(
      screen.getByRole("tablist", { name: "Project" }),
    ).toBeInTheDocument();
    const tab = screen.getByRole("tab", { name: "Overview" });
    expect(tab).toHaveAttribute("aria-selected", "true");
    expect(tab).toHaveAttribute("tabindex", "0");
    const panel = screen.getByRole("tabpanel", { name: "Overview" });
    expect(tab).toHaveAttribute("aria-controls", panel.id);
    expect(screen.getByText("Details panel")).not.toBeVisible();
    expect(screen.getByRole("tab", { name: "Details" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  it("selects on click", async () => {
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("tab", { name: "Details" }));
    expect(screen.getByRole("tab", { name: "Details" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Details panel")).toBeVisible();
    expect(onValueChange).toHaveBeenCalledWith("details");
  });

  it("moves with arrows (skipping disabled), Home and End", async () => {
    render(<Example />);
    screen.getByRole("tab", { name: "Overview" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Details" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Details" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("supports controlled use", async () => {
    const onValueChange = vi.fn();
    render(
      <Tabs value="a" onValueChange={onValueChange} variant="underline">
        <TabList aria-label="Controlled">
          <Tab value="a">A</Tab>
          <Tab value="b">B</Tab>
        </TabList>
        <TabPanel value="a">Panel A</TabPanel>
        <TabPanel value="b">Panel B</TabPanel>
      </Tabs>,
    );
    await userEvent.click(screen.getByRole("tab", { name: "B" }));
    expect(onValueChange).toHaveBeenCalledWith("b");
    expect(screen.getByRole("tab", { name: "A" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("selects the first enabled tab without a value", () => {
    render(
      <Tabs>
        <TabList aria-label="Auto">
          <Tab value="x" disabled>
            X
          </Tab>
          <Tab value="y">Y</Tab>
        </TabList>
        <TabPanel value="x">X panel</TabPanel>
        <TabPanel value="y">Y panel</TabPanel>
      </Tabs>,
    );
    expect(screen.getByRole("tab", { name: "Y" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("measures the indicator for the selected tab", () => {
    render(<Example />);
    expect(screen.getByRole("tablist")).toHaveAttribute("data-indicator");
  });
});
