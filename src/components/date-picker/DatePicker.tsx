"use client";
import {
  forwardRef,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { cx } from "../../utils/cx";
import { mergeRefs } from "../../utils/merge-refs";
import { Calendar, type CalendarLabels } from "../calendar/Calendar";
import { toISODate, type Weekday } from "../calendar/date-utils";
import {
  PickerTrigger,
  useFieldState,
  usePickerPopover,
} from "./picker-popover";
import type { DatePickerSize } from "./variants.gen";

export interface DatePickerProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "defaultValue" | "onChange" | "children"
> {
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (date: Date) => void;
  min?: Date;
  max?: Date;
  isDateDisabled?: (date: Date) => boolean;
  /** BCP 47 locale for the calendar and the trigger text. */
  locale?: string;
  weekStartsOn?: Weekday;
  /** How the trigger shows the date. Defaults to `{ dateStyle: "medium" }`. */
  formatOptions?: Intl.DateTimeFormatOptions;
  /** Shown while empty. Defaults to "Pick a date". */
  placeholder?: ReactNode;
  size?: DatePickerSize;
  /** Error state; set automatically inside a <Field error>. */
  invalid?: boolean;
  fullWidth?: boolean;
  /** Form field name: submits the date as YYYY-MM-DD. */
  name?: string;
  /** Close the popover once a day is picked. Defaults to true. */
  closeOnSelect?: boolean;
  /** Accessible name of the popover. Defaults to "Choose date". */
  dialogLabel?: string;
  calendarLabels?: CalendarLabels;
  /** Class for the outer wrapper (className goes to the trigger button). */
  wrapperClassName?: string;
}

/** Input-like trigger that opens a Calendar in a native popover. */
export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(
  function DatePicker(
    {
      value: valueProp,
      defaultValue = null,
      onChange,
      min,
      max,
      isDateDisabled,
      locale,
      weekStartsOn,
      formatOptions,
      placeholder = "Pick a date",
      size = "md",
      invalid,
      fullWidth,
      name,
      closeOnSelect = true,
      dialogLabel = "Choose date",
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
    const format = useMemo(
      () =>
        new Intl.DateTimeFormat(
          locale,
          formatOptions ?? { dateStyle: "medium" },
        ),
      [locale, formatOptions],
    );
    const popover = usePickerPopover((el) => {
      el.querySelector<HTMLElement>(
        '.cherry-calendar__day[tabindex="0"]',
      )?.focus();
    });

    const select = (date: Date) => {
      if (valueProp === undefined) setInner(date);
      onChange?.(date);
      if (closeOnSelect) popover.close();
    };

    return (
      <div
        className={cx("cherry-date-picker", wrapperClassName)}
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
          icon={<CalendarIcon />}
          display={value ? format.format(value) : null}
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
            value={value ? toISODate(value) : ""}
          />
        ) : null}
        <div
          ref={popover.popoverRef}
          id={popover.popoverId}
          popover="auto"
          role="dialog"
          aria-label={dialogLabel}
          className="cherry-date-picker__popover"
        >
          <Calendar
            value={value}
            onChange={select}
            min={min}
            max={max}
            isDateDisabled={isDateDisabled}
            locale={locale}
            weekStartsOn={weekStartsOn}
            labels={calendarLabels}
          />
        </div>
      </div>
    );
  },
);
