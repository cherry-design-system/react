import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Ellipsis } from "lucide-react";
import { cx } from "../../utils/cx";
import type { PaginationVariant } from "./variants.gen";

export type PaginationRange = Array<number | "ellipsis">;

/**
 * Page numbers to show: always the first and last `boundaries` pages and
 * `siblings` pages around the current one, with "ellipsis" for each gap.
 * The list keeps a constant length so the control does not jump in width.
 */
export function paginationRange(
  page: number,
  total: number,
  siblings = 1,
  boundaries = 1,
): PaginationRange {
  const range = (from: number, to: number) =>
    Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
  const slots = boundaries * 2 + siblings * 2 + 3;
  if (total <= slots) return range(1, total);

  const current = Math.min(Math.max(page, 1), total);
  const start = Math.max(
    Math.min(current - siblings, total - boundaries - siblings * 2 - 1),
    boundaries + 2,
  );
  const end = Math.min(
    Math.max(current + siblings, boundaries + siblings * 2 + 2),
    total - boundaries - 1,
  );
  return [
    ...range(1, boundaries),
    ...(start > boundaries + 2 ? (["ellipsis"] as const) : [boundaries + 1]),
    ...range(start, end),
    ...(end < total - boundaries - 1
      ? (["ellipsis"] as const)
      : [total - boundaries]),
    ...range(total - boundaries + 1, total),
  ];
}

export interface PaginationLabels {
  /** Landmark name. */
  nav?: string;
  previous?: string;
  next?: string;
  /** Accessible name of a page link. */
  page?: (page: number) => string;
  /** Compact text, e.g. "Page 3 of 10". */
  status?: (page: number, total: number) => ReactNode;
}

export interface PaginationProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "onChange"
> {
  /** Current page, 1-based. */
  page: number;
  /** Number of pages. */
  totalPages: number;
  /** Builds the link for a page: zero-JS pagination (Server Components). */
  getHref?: (page: number) => string;
  /** Called with the target page; renders buttons when `getHref` is absent. */
  onPageChange?: (page: number) => void;
  /** `full` (numbered pages) or `compact` ("Page 3 of 10"). */
  variant?: PaginationVariant;
  /** Pages shown either side of the current one. Defaults to 1. */
  siblings?: number;
  labels?: PaginationLabels;
}

const DEFAULT_LABELS: Required<PaginationLabels> = {
  nav: "Pagination",
  previous: "Previous",
  next: "Next",
  page: (p) => `Page ${p}`,
  status: (p, t) => `Page ${p} of ${t}`,
};

/**
 * Pagination. With `getHref` every control is a plain link (no client JS);
 * with `onPageChange` they are buttons. Unavailable steps are
 * aria-disabled, the current page has aria-current="page".
 */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(
  function Pagination(
    {
      page,
      totalPages,
      getHref,
      onPageChange,
      variant = "full",
      siblings = 1,
      labels: labelOverrides,
      className,
      ...rest
    },
    ref,
  ) {
    const labels = { ...DEFAULT_LABELS, ...labelOverrides };
    const total = Math.max(1, Math.floor(totalPages));
    const current = Math.min(Math.max(1, Math.floor(page)), total);

    const control = (
      target: number,
      content: ReactNode,
      opts: {
        className: string;
        label?: string;
        current?: boolean;
        disabled?: boolean;
      },
    ) => {
      const shared = {
        className: opts.className,
        "aria-label": opts.label,
        "aria-current": opts.current ? ("page" as const) : undefined,
      };
      if (opts.disabled) {
        // A step that leads nowhere: no href or handler, so it leaves the
        // tab order and is announced as unavailable.
        return (
          <span {...shared} aria-disabled="true">
            {content}
          </span>
        );
      }
      if (getHref) {
        return (
          <a {...shared} href={getHref(target)}>
            {content}
          </a>
        );
      }
      return (
        <button
          {...shared}
          type="button"
          onClick={opts.current ? undefined : () => onPageChange?.(target)}
        >
          {content}
        </button>
      );
    };

    const prev = control(
      current - 1,
      <>
        <ChevronLeft aria-hidden="true" />
        <span>{labels.previous}</span>
      </>,
      {
        className: "cherry-pagination__step",
        disabled: current <= 1,
      },
    );
    const next = control(
      current + 1,
      <>
        <span>{labels.next}</span>
        <ChevronRight aria-hidden="true" />
      </>,
      {
        className: "cherry-pagination__step",
        disabled: current >= total,
      },
    );

    return (
      <nav
        ref={ref}
        aria-label={labels.nav}
        className={cx("cherry-pagination", className)}
        data-variant={variant}
        {...rest}
      >
        <ul className="cherry-pagination__list">
          <li className="cherry-pagination__item">{prev}</li>
          {variant === "compact" ? (
            <li className="cherry-pagination__item">
              <span className="cherry-pagination__status">
                {labels.status(current, total)}
              </span>
            </li>
          ) : (
            paginationRange(current, total, siblings).map((p, i) => (
              <li
                key={p === "ellipsis" ? `e${i}` : p}
                className="cherry-pagination__item"
              >
                {p === "ellipsis" ? (
                  <span
                    className="cherry-pagination__ellipsis"
                    aria-hidden="true"
                  >
                    <Ellipsis />
                  </span>
                ) : (
                  control(p, p, {
                    className: "cherry-pagination__link",
                    label: labels.page(p),
                    current: p === current,
                  })
                )}
              </li>
            ))
          )}
          <li className="cherry-pagination__item">{next}</li>
        </ul>
      </nav>
    );
  },
);
