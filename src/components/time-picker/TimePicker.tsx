"use client";
import {
  forwardRef,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Clock } from "lucide-react";
import { cx } from "../../utils/cx";
import { mergeRefs } from "../../utils/merge-refs";
import {
  PickerTrigger,
  useFieldState,
  usePickerPopover,
} from "../date-picker/picker-popover";
import { TimeListbox, focusListbox, type TimeOption } from "./TimeListbox";
import {
  dayPeriods,
  formatMinutes,
  formatTimeValue,
  localeUses12h,
  parseTime,
  timeFormatter,
  timeSlots,
} from "./time-utils";
import type { TimePickerLayout, TimePickerSize } from "./variants.gen";

export interface TimePickerLabels {
  dialog?: string;
  list?: string;
  hours?: string;
  minutes?: string;
  period?: string;
}

export interface TimePickerProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "defaultValue" | "onChange" | "children"
> {
  /** "HH:mm", 24-hour. */
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string) => void;
  /** Minutes between options. Defaults to 30. */
  step?: number;
  /** Earliest time, "HH:mm". */
  min?: string;
  /** Latest time, "HH:mm". */
  max?: string;
  /** "list" (default): one column of slots. "columns": hours, minutes (and AM/PM). */
  layout?: TimePickerLayout;
  /** 12- or 24-hour clock. Defaults to the locale's. */
  hourCycle?: 12 | 24;
  locale?: string;
  placeholder?: ReactNode;
  size?: TimePickerSize;
  invalid?: boolean;
  fullWidth?: boolean;
  /** Form field name: submits "HH:mm". */
  name?: string;
  labels?: TimePickerLabels;
  /** Class for the outer wrapper (className goes to the trigger button). */
  wrapperClassName?: string;
}

/** Time trigger + popover with a list of slots or hour/minute columns. */
export const TimePicker = forwardRef<HTMLButtonElement, TimePickerProps>(
  function TimePicker(
    {
      value: valueProp,
      defaultValue = null,
      onChange,
      step = 30,
      min,
      max,
      layout = "list",
      hourCycle,
      locale,
      placeholder = "Pick a time",
      size = "md",
      invalid,
      fullWidth,
      name,
      labels,
      wrapperClassName,
      disabled,
      ...rest
    },
    ref,
  ) {
    const [inner, setInner] = useState<string | null>(defaultValue);
    const value = valueProp !== undefined ? valueProp : inner;
    const minutes = parseTime(value);
    const field = useFieldState(invalid, disabled);
    const hour12 = hourCycle ? hourCycle === 12 : localeUses12h(locale);
    const format = useMemo(
      () => timeFormatter(locale, hour12),
      [locale, hour12],
    );
    const lo = parseTime(min) ?? 0;
    const hi = parseTime(max) ?? 24 * 60 - 1;
    const columnsRef = useRef<HTMLDivElement>(null);

    const popover = usePickerPopover((el) => {
      // Center every column on its value; focus the first one.
      el.querySelectorAll<HTMLElement>('[role="listbox"]').forEach((list, i) =>
        focusListbox(list, i === 0),
      );
    });

    const commit = (next: number, close: boolean) => {
      const clamped = Math.min(Math.max(next, lo), hi);
      const str = formatTimeValue(clamped);
      if (valueProp === undefined) setInner(str);
      onChange?.(str);
      if (close) popover.close();
    };

    const listOptions = useMemo<TimeOption[]>(
      () =>
        timeSlots(step, lo, hi).map((t) => ({
          value: t,
          label: formatMinutes(t, format),
        })),
      [step, lo, hi, format],
    );

    // Columns
    const num = useMemo(
      () => new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 }),
      [locale],
    );
    const periods = useMemo(() => dayPeriods(locale), [locale]);
    const curH = minutes === null ? null : Math.floor(minutes / 60);
    const curM = minutes === null ? null : minutes % 60;
    const pm = curH !== null && curH >= 12;
    const outside = (from: number, to: number) => to < lo || from > hi;
    const hourOptions: TimeOption[] = hour12
      ? Array.from({ length: 12 }, (_, i) => {
          const h24 = i + (pm ? 12 : 0);
          return {
            value: i,
            label: num.format(i === 0 ? 12 : i),
            disabled: outside(h24 * 60, h24 * 60 + 59),
          };
        })
      : Array.from({ length: 24 }, (_, h) => ({
          value: h,
          label: num.format(h),
          disabled: outside(h * 60, h * 60 + 59),
        }));
    const minuteOptions: TimeOption[] = timeSlots(
      Math.min(Math.max(step, 1), 60),
      0,
      59,
    ).map((m) => ({
      value: m,
      label: num.format(m),
      disabled: curH !== null && outside(curH * 60 + m, curH * 60 + m),
    }));
    const periodOptions: TimeOption[] = periods.map((label, i) => ({
      value: i,
      label,
      disabled: outside(i * 720, i * 720 + 719),
    }));

    const setHour = (h: number) =>
      commit((hour12 ? (h % 12) + (pm ? 12 : 0) : h) * 60 + (curM ?? 0), false);
    const setMinute = (m: number) => commit((curH ?? 0) * 60 + m, false);
    const setPeriod = (p: number) =>
      commit((((curH ?? 0) % 12) + p * 12) * 60 + (curM ?? 0), false);

    // Left / Right hop between columns.
    const onColumnsKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const lists = Array.from(
        columnsRef.current?.querySelectorAll<HTMLElement>('[role="listbox"]') ??
          [],
      );
      const index = lists.findIndex((l) => l.contains(event.target as Node));
      const next = lists[index + (event.key === "ArrowRight" ? 1 : -1)];
      if (!next) return;
      event.preventDefault();
      focusListbox(next);
    };

    return (
      <div
        className={cx("cherry-time-picker", wrapperClassName)}
        data-size={size}
        data-layout={layout}
        data-invalid={field.invalid || undefined}
        data-disabled={field.disabled || undefined}
        data-open={popover.open || undefined}
        data-full-width={fullWidth || undefined}
        style={popover.anchorStyle}
      >
        <PickerTrigger
          ref={mergeRefs(ref, popover.triggerRef)}
          block="cherry-time-picker"
          popoverId={popover.popoverId}
          icon={<Clock />}
          display={minutes === null ? null : formatMinutes(minutes, format)}
          placeholder={placeholder}
          invalid={invalid}
          disabled={disabled}
          aria-expanded={popover.open}
          {...rest}
        />
        {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
        <div
          ref={popover.popoverRef}
          id={popover.popoverId}
          popover="auto"
          role="dialog"
          aria-label={labels?.dialog ?? "Choose time"}
          className="cherry-time-picker__popover"
        >
          {layout === "columns" ? (
            <div
              ref={columnsRef}
              className="cherry-time-picker__columns"
              onKeyDown={onColumnsKeyDown}
            >
              <TimeListbox
                className="cherry-time-picker__column"
                label={labels?.hours ?? "Hours"}
                options={hourOptions}
                value={curH === null ? null : hour12 ? curH % 12 : curH}
                onSelect={setHour}
                check={false}
              />
              <TimeListbox
                className="cherry-time-picker__column"
                label={labels?.minutes ?? "Minutes"}
                options={minuteOptions}
                value={curM}
                onSelect={setMinute}
                check={false}
              />
              {hour12 ? (
                <TimeListbox
                  className="cherry-time-picker__column"
                  label={labels?.period ?? "AM/PM"}
                  options={periodOptions}
                  value={curH === null ? null : pm ? 1 : 0}
                  onSelect={setPeriod}
                  check={false}
                />
              ) : null}
            </div>
          ) : (
            <TimeListbox
              className="cherry-time-picker__list"
              label={labels?.list ?? "Times"}
              options={listOptions}
              value={minutes}
              onSelect={(t) => commit(t, true)}
            />
          )}
        </div>
      </div>
    );
  },
);
