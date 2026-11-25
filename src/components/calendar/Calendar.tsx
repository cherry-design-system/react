"use client";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type AnimationEvent,
  type HTMLAttributes,
  type KeyboardEvent,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx } from "../../utils/cx";
import {
  addDays,
  addMonths,
  compareDays,
  isSameDay,
  isSameMonth,
  localeWeekStart,
  monthGrid,
  startOfDay,
  startOfMonth,
  toISODate,
  weekdayDates,
  type DateRange,
  type Weekday,
} from "./date-utils";

export interface CalendarLabels {
  previousMonth?: string;
  nextMonth?: string;
}

interface CalendarBaseProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  /** Visible month (controlled). Any day inside the month works. */
  month?: Date;
  /** Initial visible month (uncontrolled). Defaults to the selection or today. */
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  /** Earliest selectable day. */
  min?: Date;
  /** Latest selectable day. */
  max?: Date;
  /** Extra rule for unavailable days (weekends, booked dates...). */
  isDateDisabled?: (date: Date) => boolean;
  /** BCP 47 locale for month and weekday names. Defaults to the runtime's. */
  locale?: string;
  /** 0 = Sunday ... 6 = Saturday. Defaults to the locale's first day. */
  weekStartsOn?: Weekday;
  /** Override "today" (tests, server rendering in another time zone). */
  today?: Date;
  /** Button labels (translate here). */
  labels?: CalendarLabels;
  /** Fill the container: the seven day columns share its width. */
  fullWidth?: boolean;
}

export interface CalendarSingleProps extends CalendarBaseProps {
  mode?: "single";
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (date: Date) => void;
}

export interface CalendarRangeProps extends CalendarBaseProps {
  mode: "range";
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onChange?: (range: DateRange) => void;
}

export type CalendarProps = CalendarSingleProps | CalendarRangeProps;

type Direction = "next" | "prev";
type RangePart = "start" | "middle" | "end";

// Fallback for a leaving month whose animationend never comes (no CSS).
const LEAVE_MS = 450;

/**
 * Month grid (role="grid"). Arrows move by day/week, PageUp/PageDown by
 * month (with Shift by year), Home/End to the week's edges. Single date or
 * range selection; changing month slides the grid.
 */
export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
  function Calendar(props, ref) {
    const {
      mode = "single",
      value: valueProp,
      defaultValue,
      onChange,
      month: monthProp,
      defaultMonth,
      onMonthChange,
      min,
      max,
      isDateDisabled,
      locale,
      weekStartsOn: weekStartsOnProp,
      today: todayProp,
      labels,
      fullWidth,
      className,
      ...rest
    } = props;

    const isRange = mode === "range";
    const [innerValue, setInnerValue] = useState<Date | DateRange | null>(
      defaultValue ?? null,
    );
    const value = (valueProp !== undefined ? valueProp : innerValue) as
      Date | DateRange | null;
    const single = !isRange && value instanceof Date ? value : null;
    const range =
      isRange && value && !(value instanceof Date)
        ? (value as DateRange)
        : null;

    const today = useMemo(
      () => startOfDay(todayProp ?? new Date()),
      [todayProp],
    );
    const anchor = single ?? range?.start ?? today;

    const [innerMonth, setInnerMonth] = useState(() =>
      startOfMonth(defaultMonth ?? anchor),
    );
    const month = startOfMonth(monthProp ?? innerMonth);
    const monthKey = toISODate(month);

    const weekStartsOn = weekStartsOnProp ?? localeWeekStart(locale);
    const days = useMemo(
      () => monthGrid(month, weekStartsOn),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [monthKey, weekStartsOn],
    );

    const formats = useMemo(
      () => ({
        title: new Intl.DateTimeFormat(locale, {
          month: "long",
          year: "numeric",
        }),
        day: new Intl.DateTimeFormat(locale, { day: "numeric" }),
        full: new Intl.DateTimeFormat(locale, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        weekdayShort: new Intl.DateTimeFormat(locale, { weekday: "short" }),
        weekdayLong: new Intl.DateTimeFormat(locale, { weekday: "long" }),
      }),
      [locale],
    );

    const isDisabled = useCallback(
      (date: Date) =>
        (min !== undefined && compareDays(date, min) < 0) ||
        (max !== undefined && compareDays(date, max) > 0) ||
        (isDateDisabled?.(date) ?? false),
      [min, max, isDateDisabled],
    );

    // Roving focus: the one tabbable day, always inside the visible month.
    const [focusDate, setFocusDate] = useState(() =>
      isSameMonth(anchor, month) ? anchor : month,
    );
    const tabbable = isSameMonth(focusDate, month) ? focusDate : month;
    const shouldFocus = useRef(false);
    const gridRef = useRef<HTMLDivElement>(null);

    const [hovered, setHovered] = useState<Date | null>(null);

    // The month that just left, kept for its exit animation.
    const [leaving, setLeaving] = useState<{
      month: Date;
      direction: Direction;
    } | null>(null);
    const [direction, setDirection] = useState<Direction | null>(null);
    const prevMonth = useRef(month);
    useLayoutEffect(() => {
      const prev = prevMonth.current;
      if (isSameMonth(prev, month)) return;
      prevMonth.current = month;
      const dir: Direction = compareDays(month, prev) > 0 ? "next" : "prev";
      setDirection(dir);
      setLeaving({ month: prev, direction: dir });
      if (!isSameMonth(focusDate, month)) {
        setFocusDate(
          addMonths(focusDate, compareDays(month, prev) > 0 ? 1 : -1),
        );
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monthKey]);
    useEffect(() => {
      if (!leaving) return;
      const timer = window.setTimeout(() => setLeaving(null), LEAVE_MS);
      return () => window.clearTimeout(timer);
    }, [leaving]);

    useEffect(() => {
      if (!shouldFocus.current) return;
      shouldFocus.current = false;
      // Only the live month: the leaving one (inert, mid-animation) shows six
      // weeks too, so its trailing row can hold the same dates.
      gridRef.current
        ?.querySelector<HTMLButtonElement>(
          `.cherry-calendar__weeks:not([data-leaving]) [data-date="${toISODate(tabbable)}"]`,
        )
        ?.focus();
    });

    const goToMonth = (next: Date) => {
      const target = startOfMonth(next);
      if (isSameMonth(target, month)) return;
      if (monthProp === undefined) setInnerMonth(target);
      onMonthChange?.(target);
    };

    const select = (date: Date) => {
      if (isDisabled(date)) return;
      if (!isSameMonth(date, month)) goToMonth(date);
      setFocusDate(date);
      if (isRange) {
        let next: DateRange;
        if (!range || range.end) next = { start: date, end: null };
        else if (compareDays(date, range.start) < 0)
          next = { start: date, end: range.start };
        else next = { start: range.start, end: date };
        if (valueProp === undefined) setInnerValue(next);
        setHovered(null);
        (onChange as ((r: DateRange) => void) | undefined)?.(next);
      } else {
        if (valueProp === undefined) setInnerValue(date);
        (onChange as ((d: Date) => void) | undefined)?.(date);
      }
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      const from = tabbable;
      let next: Date | null = null;
      const dow = (from.getDay() - weekStartsOn + 7) % 7;
      switch (event.key) {
        case "ArrowLeft":
          next = addDays(from, -1);
          break;
        case "ArrowRight":
          next = addDays(from, 1);
          break;
        case "ArrowUp":
          next = addDays(from, -7);
          break;
        case "ArrowDown":
          next = addDays(from, 7);
          break;
        case "PageUp":
          next = addMonths(from, event.shiftKey ? -12 : -1);
          break;
        case "PageDown":
          next = addMonths(from, event.shiftKey ? 12 : 1);
          break;
        case "Home":
          next = addDays(from, -dow);
          break;
        case "End":
          next = addDays(from, 6 - dow);
          break;
        default:
          return;
      }
      event.preventDefault();
      if (min && compareDays(next, min) < 0) next = startOfDay(min);
      if (max && compareDays(next, max) > 0) next = startOfDay(max);
      shouldFocus.current = true;
      setFocusDate(next);
      if (!isSameMonth(next, month)) goToMonth(next);
    };

    const prevDisabled =
      min !== undefined && compareDays(addDays(month, -1), min) < 0;
    const nextDisabled =
      max !== undefined && compareDays(addMonths(month, 1), max) > 0;

    const rangeEnd = range?.end ?? (range && hovered ? hovered : null);
    const [lo, hi] =
      range && rangeEnd
        ? compareDays(rangeEnd, range.start) < 0
          ? [rangeEnd, range.start]
          : [range.start, rangeEnd]
        : [range?.start ?? null, range?.start ?? null];

    const rangePart = (date: Date): RangePart | undefined => {
      if (!lo || !hi || isSameDay(lo, hi)) return undefined;
      if (isSameDay(date, lo)) return "start";
      if (isSameDay(date, hi)) return "end";
      if (compareDays(date, lo) > 0 && compareDays(date, hi) < 0)
        return "middle";
      return undefined;
    };

    const titleId = `cherry-calendar-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}-title`;

    const renderWeeks = (
      grid: Date[],
      shown: Date,
      interactive: boolean,
      extra: {
        direction?: Direction | null;
        leaving?: boolean;
        onAnimationEnd?: (event: AnimationEvent<HTMLDivElement>) => void;
      },
    ) => (
      <div
        key={`${toISODate(shown)}${extra.leaving ? "-leaving" : ""}`}
        className="cherry-calendar__weeks"
        role={interactive ? "rowgroup" : undefined}
        aria-hidden={interactive ? undefined : true}
        inert={!interactive || undefined}
        data-direction={extra.direction ?? undefined}
        data-leaving={extra.leaving || undefined}
        onAnimationEnd={extra.onAnimationEnd}
      >
        {Array.from({ length: 6 }, (_, w) => (
          <div
            key={w}
            className="cherry-calendar__week"
            role={interactive ? "row" : undefined}
          >
            {grid.slice(w * 7, w * 7 + 7).map((date) => {
              const outside = !isSameMonth(date, shown);
              const selected = isRange
                ? !!lo &&
                  !!hi &&
                  !!range &&
                  compareDays(date, lo) >= 0 &&
                  compareDays(date, hi) <= 0
                : isSameDay(date, single);
              const endpoint = isRange
                ? isSameDay(date, range?.start) || isSameDay(date, range?.end)
                : selected;
              const disabled = isDisabled(date);
              const isToday = isSameDay(date, today);
              const part = isRange ? rangePart(date) : undefined;
              return (
                <div
                  key={toISODate(date)}
                  className="cherry-calendar__cell"
                  role={interactive ? "gridcell" : undefined}
                  aria-selected={interactive ? selected : undefined}
                  data-range={part}
                  data-preview={(part && range && !range.end) || undefined}
                >
                  <button
                    type="button"
                    className="cherry-calendar__day"
                    tabIndex={interactive && isSameDay(date, tabbable) ? 0 : -1}
                    aria-label={formats.full.format(date)}
                    aria-current={isToday ? "date" : undefined}
                    aria-disabled={disabled || undefined}
                    data-date={toISODate(date)}
                    data-outside={outside || undefined}
                    data-today={isToday || undefined}
                    data-selected={endpoint || undefined}
                    onClick={interactive ? () => select(date) : undefined}
                    onFocus={
                      interactive && !isSameDay(date, focusDate)
                        ? () => setFocusDate(date)
                        : undefined
                    }
                    onPointerEnter={
                      interactive && isRange && range && !range.end
                        ? () => setHovered(date)
                        : undefined
                    }
                  >
                    {formats.day.format(date)}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );

    return (
      <div
        ref={ref}
        className={cx("cherry-calendar", className)}
        data-mode={mode}
        data-full-width={fullWidth || undefined}
        {...rest}
      >
        <div className="cherry-calendar__header">
          <button
            type="button"
            className="cherry-calendar__nav"
            aria-label={labels?.previousMonth ?? "Previous month"}
            disabled={prevDisabled}
            onClick={() => goToMonth(addMonths(month, -1))}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <span
            className="cherry-calendar__title"
            id={titleId}
            aria-live="polite"
          >
            <span
              key={monthKey}
              className="cherry-calendar__title-text"
              data-direction={direction ?? undefined}
            >
              {formats.title.format(month)}
            </span>
          </span>
          <button
            type="button"
            className="cherry-calendar__nav"
            aria-label={labels?.nextMonth ?? "Next month"}
            disabled={nextDisabled}
            onClick={() => goToMonth(addMonths(month, 1))}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
        <div
          ref={gridRef}
          className="cherry-calendar__grid"
          role="grid"
          aria-labelledby={titleId}
          onKeyDown={onKeyDown}
          onPointerLeave={hovered ? () => setHovered(null) : undefined}
        >
          <div className="cherry-calendar__weekdays" role="row">
            {weekdayDates(weekStartsOn).map((d) => (
              <div
                key={d.getDay()}
                className="cherry-calendar__weekday"
                role="columnheader"
              >
                <span aria-hidden="true">{formats.weekdayShort.format(d)}</span>
                <span className="cherry-sr-only">
                  {formats.weekdayLong.format(d)}
                </span>
              </div>
            ))}
          </div>
          <div className="cherry-calendar__viewport">
            {leaving
              ? renderWeeks(
                  monthGrid(leaving.month, weekStartsOn),
                  leaving.month,
                  false,
                  {
                    direction: leaving.direction,
                    leaving: true,
                    onAnimationEnd: (event) => {
                      if (event.target === event.currentTarget)
                        setLeaving(null);
                    },
                  },
                )
              : null}
            {renderWeeks(days, month, true, { direction })}
          </div>
        </div>
      </div>
    );
  },
);
