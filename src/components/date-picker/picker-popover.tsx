"use client";
// Shared by DatePicker, TimePicker and DateTimePicker: a trigger button that
// opens a native `popover` (light dismiss, Escape and focus return come from
// the browser), anchored to the trigger with CSS anchor positioning.
import {
  forwardRef,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cx } from "../../utils/cx";
import { FieldContext, useFieldControl } from "../field/field-context";

type PopoverElement = HTMLElement & {
  showPopover?: () => void;
  hidePopover?: () => void;
};

export function usePickerPopover(onOpen?: (popover: HTMLElement) => void) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const popoverId = `cherry-picker-${id}`;
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  useEffect(() => {
    const el = popoverRef.current;
    if (!el) return;
    const onToggle = (event: Event) => {
      const isOpen =
        (event as Event & { newState?: string }).newState === "open";
      setOpen(isOpen);
      if (isOpen) onOpenRef.current?.(el);
    };
    el.addEventListener("toggle", onToggle);
    return () => el.removeEventListener("toggle", onToggle);
  }, []);

  /** Hides the popover and gives focus back to the trigger. */
  const close = () => {
    (popoverRef.current as PopoverElement | null)?.hidePopover?.();
    triggerRef.current?.focus();
  };

  return {
    popoverId,
    popoverRef,
    triggerRef,
    open,
    close,
    /** Custom property naming the anchor; set it on the component root. */
    anchorStyle: { "--_anchor": `--${popoverId}` } as CSSProperties,
  };
}

export interface PickerTriggerProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "value"
> {
  /** BEM block, e.g. "cherry-date-picker". */
  block: string;
  popoverId: string;
  icon: ReactNode;
  /** Formatted value; the placeholder shows when empty. */
  display: ReactNode;
  placeholder: ReactNode;
  invalid?: boolean;
  required?: boolean;
}

/** Input-looking button that opens the picker popover. */
export const PickerTrigger = forwardRef<HTMLButtonElement, PickerTriggerProps>(
  function PickerTrigger(
    {
      block,
      popoverId,
      icon,
      display,
      placeholder,
      invalid,
      className,
      ...props
    },
    ref,
  ) {
    const { required, ...control } = useFieldControl({
      ...props,
      "aria-invalid": invalid ? true : props["aria-invalid"],
    });
    // Inside a <Field>, announce "label, value" (a button named by its
    // <label> alone would hide the chosen value).
    const field = useContext(FieldContext);
    const textId = `${popoverId}-text`;
    const labelledBy =
      props["aria-labelledby"] ??
      (field && !props["aria-label"]
        ? `${field.labelId} ${textId}`
        : undefined);
    return (
      <button
        ref={ref}
        type="button"
        className={cx(`${block}__trigger`, className)}
        popoverTarget={popoverId}
        aria-haspopup="dialog"
        aria-required={required || undefined}
        {...control}
        aria-labelledby={labelledBy}
      >
        <span className={`${block}__icon`} aria-hidden="true">
          {icon}
        </span>
        {display ? (
          <span id={textId} className={`${block}__value`}>
            {display}
          </span>
        ) : (
          <span id={textId} className={`${block}__placeholder`}>
            {placeholder}
          </span>
        )}
      </button>
    );
  },
);

/** Invalid / disabled from the props or the surrounding Field. */
export function useFieldState(
  invalid: boolean | undefined,
  disabled: boolean | undefined,
) {
  const control = useFieldControl<{
    "aria-invalid"?: boolean;
    disabled?: boolean;
  }>({ "aria-invalid": invalid || undefined, disabled });
  return {
    invalid: control["aria-invalid"] === true,
    disabled: control.disabled === true,
  };
}
