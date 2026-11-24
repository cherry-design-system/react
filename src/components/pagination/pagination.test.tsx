import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination, paginationRange } from "./index";

describe("paginationRange", () => {
  it("shows every page when they fit", () => {
    expect(paginationRange(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });
  it("adds ellipses around the current window", () => {
    expect(paginationRange(1, 10)).toEqual([1, 2, 3, 4, 5, "ellipsis", 10]);
    expect(paginationRange(5, 10)).toEqual([
      1,
      "ellipsis",
      4,
      5,
      6,
      "ellipsis",
      10,
    ]);
    expect(paginationRange(10, 10)).toEqual([1, "ellipsis", 6, 7, 8, 9, 10]);
  });
});

describe("Pagination", () => {
  it("renders links with hrefs and marks the current page", () => {
    render(
      <Pagination page={3} totalPages={10} getHref={(p) => `?page=${p}`} />,
    );
    expect(
      screen.getByRole("navigation", { name: "Pagination" }),
    ).toBeInTheDocument();
    const current = screen.getByRole("link", { name: "Page 3" });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute(
      "href",
      "?page=2",
    );
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "?page=4",
    );
  });

  it("disables previous on the first page", () => {
    render(<Pagination page={1} totalPages={3} getHref={(p) => `/${p}`} />);
    expect(
      screen.queryByRole("link", { name: "Previous" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Previous").parentElement).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("renders buttons with onPageChange", async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Page 4" }));
    expect(onPageChange).toHaveBeenCalledWith(4);
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("compact variant shows a status and translated labels", () => {
    render(
      <Pagination
        page={3}
        totalPages={10}
        variant="compact"
        getHref={(p) => `/${p}`}
        labels={{
          previous: "Zurück",
          status: (p, t) => `Seite ${p} von ${t}`,
        }}
      />,
    );
    expect(screen.getByText("Seite 3 von 10")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Zurück" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Page 3" }),
    ).not.toBeInTheDocument();
  });
});
