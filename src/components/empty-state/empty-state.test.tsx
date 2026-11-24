import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./index";

describe("EmptyState", () => {
  it("renders a heading, description and actions", () => {
    render(
      <EmptyState
        title="No projects yet"
        description="Create your first project."
        actions={<button type="button">New project</button>}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 3, name: "No projects yet" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Create your first project.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New project" }),
    ).toBeInTheDocument();
  });

  it("supports another heading level and no icon", () => {
    const { container } = render(
      <EmptyState title="Empty" headingLevel={2} icon={null} />,
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Empty",
    );
    expect(
      container.querySelector(".cherry-empty-state__icon"),
    ).not.toBeInTheDocument();
  });
});
