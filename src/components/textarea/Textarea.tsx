"use client";
import {
  forwardRef,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type Ref,
  type TextareaHTMLAttributes,
} from "react";
import { cx } from "../../utils/cx";
import { assignRef } from "../../utils/merge-refs";
import { useFieldControl } from "../field/field-context";
import type { TextareaSize } from "./variants.gen";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: TextareaSize;
  /** Error state; set automatically inside a <Field error>. */
  invalid?: boolean;
  /** Grow with the content (CSS field-sizing, JS fallback). Defaults to true. */
  autoResize?: boolean;
  /** Cap for auto-resize, in rows; scrolls beyond it. */
  maxRows?: number;
  /** Show a character count (against maxLength when set). */
  showCount?: boolean;
  /** Accessible text for the count. Defaults to "{count} of {max} characters". */
  countLabel?: (count: number, max: number | undefined) => string;
  /** Class for the outer wrapper (className goes to the <textarea>). */
  wrapperClassName?: string;
}

const useIsoLayoutEffect =
  typeof window === "undefined" ? () => {} : useLayoutEffect;

const supportsFieldSizing = () =>
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("field-sizing", "content");

const defaultCountLabel = (count: number, max: number | undefined) =>
  max === undefined ? `${count} characters` : `${count} of ${max} characters`;

/** Multi-line text input that grows with its content. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      size = "md",
      invalid,
      autoResize = true,
      maxRows,
      rows = 4,
      showCount = false,
      countLabel = defaultCountLabel,
      wrapperClassName,
      className,
      style,
      onChange,
      ...props
    },
    ref,
  ) {
    const inner = useRef<HTMLTextAreaElement | null>(null);
    const setRef = useCallback(
      (node: HTMLTextAreaElement | null) => {
        inner.current = node;
        assignRef(ref, node);
      },
      [ref],
    );
    const countId = useId();
    const initial = props.value ?? props.defaultValue ?? "";
    const [length, setLength] = useState(String(initial).length);
    const count =
      props.value !== undefined ? String(props.value).length : length;

    // Fallback for browsers without field-sizing: grow to scrollHeight.
    const fit = useCallback(() => {
      const el = inner.current;
      if (!el || !autoResize || supportsFieldSizing()) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }, [autoResize]);
    useIsoLayoutEffect(fit, [fit, props.value]);

    const control = useFieldControl({
      ...props,
      "aria-invalid": invalid ? true : props["aria-invalid"],
    });
    const isInvalid =
      control["aria-invalid"] === true || control["aria-invalid"] === "true";
    const describedBy = showCount
      ? cx(control["aria-describedby"], countId)
      : control["aria-describedby"];
    const max = props.maxLength;
    const atLimit = max !== undefined && count >= max;

    return (
      <div
        className={cx("cherry-textarea", wrapperClassName)}
        data-size={size}
        data-invalid={isInvalid || undefined}
        data-disabled={control.disabled || undefined}
        data-auto-resize={autoResize || undefined}
        style={
          {
            ...style,
            "--_rows": rows,
            ...(maxRows ? { "--_max-rows": maxRows } : null),
          } as CSSProperties
        }
      >
        <textarea
          ref={setRef}
          rows={rows}
          className={cx("cherry-textarea__control", className)}
          {...control}
          aria-describedby={describedBy || undefined}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
            setLength(event.target.value.length);
            fit();
            onChange?.(event);
          }}
        />
        {showCount ? (
          <span
            className="cherry-textarea__count"
            id={countId}
            data-limit={atLimit || undefined}
          >
            <span aria-hidden="true">
              {max === undefined ? count : `${count}/${max}`}
            </span>
            <span className="cherry-sr-only">{countLabel(count, max)}</span>
          </span>
        ) : null}
      </div>
    );
  },
);
