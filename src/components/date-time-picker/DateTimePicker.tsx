"use client";
import {
  forwardRef,
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { CalendarClock } from "lucide-react";
import { cx } from "../../utils/cx";
import { mergeRefs } from "../../utils/merge-refs";
import { Button } from "../button/Button";
import { Calendar, type CalendarLabels } from "../calendar/Calendar";
import { startOfDay, toISODate, type Weekday } from "../calendar/date-utils";
import {
  PickerTrigger,
  useFieldState,
  usePickerPopover,
} from "../date-picker/picker-popover";
import type { DatePickerSize } from "../date-picker/variants.gen";
import { TimeListbox, focusListbox } from "../time-picker/TimeListbox";
import {
  formatMinutes,
  formatTimeValue,
  localeUses12h,
  timeFormatter,
  timeSlots,
} from "../time-picker/time-utils";

export interface DateTimePickerLabels {
  dialog?: string;
  time?: string;
  cancel?: string;
  apply?: string;
}

export interface DateTimePickerProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "defaultValue" | "onChange" | "children"
> {
  value?: Date | null;
  defaultValue?: Date | null;
  /** Called on Apply with the picked day at the picked time. */
  onChange?: (value: Date) => void;
  min?: Date;
  max?: Date;
  isDateDisabled?: (date: Date) => boolean;
  /** Minutes between time slots. Defaults to 30. */
  step?: number;
  hourCycle?: 12 | 24;
  locale?: string;
  weekStartsOn?: Weekday;
  /** How the trigger shows the day. Defaults to `{ dateStyle: "medium" }`. */
  dateFormatOptions?: Intl.DateTimeFormatOptions;
  placeholder?: ReactNode;
  size?: DatePickerSize;
  invalid?: boolean;
  fullWidth?: boolean;
  /** Form field name: submits "YYYY-MM-DDTHH:mm" (local). */
  name?: string;
  labels?: DateTimePickerLabels;
  calendarLabels?: CalendarLabels;
  /** Class for the outer wrapper (className goes to the trigger button). */
  wrapperClassName?: string;
}

const minutesOf = (date: Date) => date.getHours() * 60 + date.getMinutes();
const withMinutes = (day: Date, minutes: number) =>
  new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    Math.floor(minutes / 60),
    minutes % 60,
  );

/**
 * Day and time in one popover: Calendar beside a column of time slots, then
 * Cancel / Apply. Reuses the DatePicker trigger, so it needs date-picker.css,
 * calendar.css, time-picker.css and button.css besides its own stylesheet.
 */
export const DateTimePicker = forwardRef<
  HTMLButtonElement,
  DateTimePickerProps
>(function DateTimePicker(
  {
    value: valueProp,
    defaultValue = null,
    onChange,
    min,
    max,
    isDateDisabled,
    step = 30,
    hourCycle,
    locale,
    weekStartsOn,
    dateFormatOptions,
    placeholder = "Pick a date and time",
    size = "md",
    invalid,
    fullWidth,
    name,
    labels,
    calendarLabels,
    wrapperClassName,
    disabled,
    ...rest
  },
  ref,
) {
  const [inner, setInner] = useState<Date | null>(defaultValue);
  const value = valueProp !== undefined ? valueProp : inner;
  const field = useFieldState(invalid, disabled);
  const hour12 = hourCycle ? hourCycle === 12 : localeUses12h(locale);
  const dateFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(
        locale,
        dateFormatOptions ?? { dateStyle: "medium" },
      ),
    [locale, dateFormatOptions],
  );
  const timeFormat = useMemo(
    () => timeFormatter(locale, hour12),
    [locale, hour12],
  );
  const slots = useMemo(
    () =>
      timeSlots(step).map((t) => ({
        value: t,
        label: formatMinutes(t, timeFormat),
      })),
    [step, timeFormat],
  );

  // Draft until Apply.
  const [draftDay, setDraftDay] = useState<Date | null>(value);
  const [draftTime, setDraftTime] = useState<number | null>(
    value ? minutesOf(value) : null,
  );

  const popover = usePickerPopover(() => {
    setDraftDay(value ? startOfDay(value) : null);
    setDraftTime(value ? minutesOf(value) : null);
  });
  // Once the drafts have rendered: center the time column, focus the day.
  useEffect(() => {
    const el = popover.popoverRef.current;
    if (!popover.open || !el) return;
    focusListbox(el.querySelector<HTMLElement>('[role="listbox"]'), false);
    el.querySelector<HTMLElement>(
      '.cherry-calendar__day[tabindex="0"]',
    )?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popover.open]);

  const apply = () => {
    if (!draftDay) return;
    const next = withMinutes(draftDay, draftTime ?? slots[0]?.value ?? 0);
    if (valueProp === undefined) setInner(next);
    onChange?.(next);
    popover.close();
  };

  const display = value
    ? `${dateFormat.format(value)} · ${formatMinutes(minutesOf(value), timeFormat)}`
    : null;

  return (
    <div
      className={cx(
        "cherry-date-picker cherry-date-time-picker",
        wrapperClassName,
      )}
      data-size={size}
      data-invalid={field.invalid || undefined}
      data-disabled={field.disabled || undefined}
      data-open={popover.open || undefined}
      data-full-width={fullWidth || undefined}
      style={popover.anchorStyle}
    >
      <PickerTrigger
        ref={mergeRefs(ref, popover.triggerRef)}
        block="cherry-date-picker"
        popoverId={popover.popoverId}
        icon={<CalendarClock />}
        display={display}
        placeholder={placeholder}
        invalid={invalid}
        disabled={disabled}
        aria-expanded={popover.open}
        {...rest}
      />
      {name ? (
        <input
          type="hidden"
          name={name}
          value={
            value
              ? `${toISODate(value)}T${formatTimeValue(minutesOf(value))}`
              : ""
          }
        />
      ) : null}
      <div
        ref={popover.popoverRef}
        id={popover.popoverId}
        popover="auto"
        role="dialog"
        aria-label={labels?.dialog ?? "Choose date and time"}
        className="cherry-date-picker__popover cherry-date-time-picker__popover"
      >
        <div className="cherry-date-time-picker__body">
          <Calendar
            value={draftDay}
            onChange={setDraftDay}
            min={min}
            max={max}
            isDateDisabled={isDateDisabled}
            locale={locale}
            weekStartsOn={weekStartsOn}
            labels={calendarLabels}
          />
          <div className="cherry-date-time-picker__time">
            <span
              className="cherry-date-time-picker__time-label"
              aria-hidden="true"
            >
              {labels?.time ?? "Time"}
            </span>
            <TimeListbox
              className="cherry-time-picker__list"
              label={labels?.time ?? "Time"}
              options={slots}
              value={draftTime}
              onSelect={setDraftTime}
              check={false}
            />
          </div>
        </div>
        <div className="cherry-date-time-picker__footer">
          <Button variant="ghost" size="sm" onClick={popover.close}>
            {labels?.cancel ?? "Cancel"}
          </Button>
          <Button size="sm" disabled={!draftDay} onClick={apply}>
            {labels?.apply ?? "Apply"}
          </Button>
        </div>
      </div>
    </div>
  );
});
