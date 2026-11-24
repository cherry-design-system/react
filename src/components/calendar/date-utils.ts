// Plain Date helpers for the calendar and the pickers. Every date is a local
// calendar day at midnight; no date library, no time zones beyond the
// runtime's own.

/** 0 = Sunday ... 6 = Saturday (same as Date#getDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DateRange {
  start: Date;
  /** `null` while the second end is still being picked. */
  end: Date | null;
}

export const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const startOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1);

export const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** Adds months, clamping the day (Jan 31 + 1 month = Feb 28/29). */
export function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  return new Date(
    target.getFullYear(),
    target.getMonth(),
    Math.min(date.getDate(), lastDay),
  );
}

export const isSameDay = (
  a: Date | null | undefined,
  b: Date | null | undefined,
) =>
  !!a &&
  !!b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const isSameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

/** Negative when a is before b, by calendar day. */
export const compareDays = (a: Date, b: Date) =>
  startOfDay(a).getTime() - startOfDay(b).getTime();

/** Local YYYY-MM-DD (for keys and form values). */
export function toISODate(date: Date): string {
  const y = String(date.getFullYear()).padStart(4, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** First day of the week for a locale, from Intl when the runtime knows it. */
export function localeWeekStart(locale?: string): Weekday {
  try {
    const loc = new Intl.Locale(
      locale ?? new Intl.DateTimeFormat().resolvedOptions().locale,
    ) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    if (info) return (info.firstDay % 7) as Weekday;
  } catch {
    // Unknown locale or no Intl.Locale: fall through.
  }
  return 1;
}

/** 42 days (6 weeks) covering the month, starting on weekStartsOn. */
export function monthGrid(month: Date, weekStartsOn: Weekday): Date[] {
  const first = startOfMonth(month);
  const offset = (first.getDay() - weekStartsOn + 7) % 7;
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** Seven weekday dates (any week) in display order, for header labels. */
export function weekdayDates(weekStartsOn: Weekday): Date[] {
  // 2023-01-01 was a Sunday.
  return Array.from(
    { length: 7 },
    (_, i) => new Date(2023, 0, 1 + ((weekStartsOn + i) % 7)),
  );
}
