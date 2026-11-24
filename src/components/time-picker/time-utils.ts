// Times are minutes after midnight internally and "HH:mm" (24h) strings at
// the API edge: no time zone, no date library.

/** "HH:mm" or "H:mm" to minutes after midnight; null when malformed. */
export function parseTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

/** Minutes after midnight to "HH:mm". */
export function formatTimeValue(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Every `step` minutes from min to max, inclusive. */
export function timeSlots(step: number, min = 0, max = 24 * 60 - 1): number[] {
  const safeStep = Math.max(1, Math.floor(step));
  const out: number[] = [];
  for (let t = Math.max(0, min); t <= Math.min(max, 24 * 60 - 1); t += safeStep)
    out.push(t);
  return out;
}

/** Whether the locale shows a 12-hour clock. */
export function localeUses12h(locale?: string): boolean {
  try {
    const opts = new Intl.DateTimeFormat(locale, {
      hour: "numeric",
    }).resolvedOptions();
    if (opts.hourCycle)
      return opts.hourCycle === "h11" || opts.hourCycle === "h12";
    return opts.hour12 ?? false;
  } catch {
    return false;
  }
}

export function timeFormatter(locale: string | undefined, hour12: boolean) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12,
  });
}

/** Formats minutes after midnight with an Intl formatter. */
export const formatMinutes = (minutes: number, format: Intl.DateTimeFormat) =>
  format.format(new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60));

/** Localized AM / PM labels. */
export function dayPeriods(locale?: string): [string, string] {
  const fmt = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    hour12: true,
  });
  const pick = (h: number) =>
    fmt
      .formatToParts(new Date(2000, 0, 1, h))
      .find((p) => p.type === "dayPeriod")?.value ?? (h < 12 ? "AM" : "PM");
  return [pick(9), pick(15)];
}
