"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { ArrowUp } from "lucide-react";
import { cx } from "../../utils/cx";
import { Spinner } from "../spinner";

export interface ChatInputProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "defaultValue" | "onChange"
> {
  /** Controlled text. */
  value?: string;
  /** Initial text when uncontrolled. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Enter (or the send button) with non-blank text. Uncontrolled input clears after. */
  onSend?: (value: string) => void;
  /** A reply is on its way: the send button spins and sending is blocked. */
  loading?: boolean;
  /** Animated AI gradient border with a soft halo. */
  glow?: boolean;
  /** Controls at the start of the footer (attach, tools...), e.g. IconButtons. */
  actions?: ReactNode;
  /** Small print under the composer ("AI can make mistakes."). */
  footnote?: ReactNode;
  /** Tallest the text area grows before it scrolls, in px. Defaults to 160. */
  maxHeight?: number;
  sendLabel?: string;
  loadingLabel?: string;
}

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const fieldSizing = () =>
  typeof CSS !== "undefined" && CSS.supports?.("field-sizing", "content");

/**
 * Chat composer (Figma "ChatInput", 1.x chat-input): a growing text area,
 * an action row and a round send button. Enter sends, Shift+Enter breaks
 * the line, an IME composition keeps Enter. With `glow` the border becomes
 * a rotating AI gradient that brightens on hover and focus.
 */
export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  function ChatInput(
    {
      value,
      defaultValue = "",
      onValueChange,
      onSend,
      loading,
      glow,
      actions,
      footnote,
      maxHeight = 160,
      sendLabel = "Send message",
      loadingLabel = "Waiting for the reply",
      placeholder = "Ask anything…",
      "aria-label": ariaLabel = "Message",
      disabled,
      onKeyDown,
      className,
      style,
      rows = 1,
      ...rest
    },
    ref,
  ) {
    const [inner, setInner] = useState(defaultValue);
    const text = value ?? inner;
    const setText = (next: string) => {
      if (value === undefined) setInner(next);
      onValueChange?.(next);
    };
    const ready = text.trim().length > 0 && !loading && !disabled;

    const areaRef = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => areaRef.current as HTMLTextAreaElement);

    // Auto-grow where field-sizing: content is not supported yet.
    useIsoLayoutEffect(() => {
      const area = areaRef.current;
      if (!area || fieldSizing()) return;
      area.style.height = "auto";
      const borders = area.offsetHeight - area.clientHeight;
      area.style.height = `${Math.min(area.scrollHeight + borders, maxHeight)}px`;
    }, [text, maxHeight]);

    const send = () => {
      if (!ready) return;
      onSend?.(text);
      if (value === undefined) setInner("");
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.nativeEvent.isComposing
      ) {
        event.preventDefault();
        send();
      }
    };

    return (
      <div
        className={cx("cherry-chat-input", className)}
        style={style}
        data-glow={glow || undefined}
        data-disabled={disabled || undefined}
      >
        <form
          className="cherry-chat-input__frame"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <div className="cherry-chat-input__surface">
            <textarea
              ref={areaRef}
              className="cherry-chat-input__textarea"
              rows={rows}
              placeholder={placeholder}
              aria-label={ariaLabel}
              disabled={disabled}
              style={{ maxHeight }}
              {...rest}
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="cherry-chat-input__footer">
              <div className="cherry-chat-input__actions">{actions}</div>
              <button
                type="submit"
                className="cherry-chat-input__send"
                aria-label={loading ? loadingLabel : sendLabel}
                aria-disabled={!ready || undefined}
                data-ready={ready || undefined}
                disabled={disabled}
                onClick={(event) => {
                  if (!ready) event.preventDefault();
                }}
              >
                {loading ? (
                  <Spinner size="xs" label={null} />
                ) : (
                  <ArrowUp
                    key={String(ready)}
                    className="cherry-chat-input__arrow"
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
          </div>
        </form>
        {footnote ? (
          <p className="cherry-chat-input__footnote">{footnote}</p>
        ) : null}
      </div>
    );
  },
);
