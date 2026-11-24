import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cx } from "../../utils/cx";

export interface ChatSuggestionsProps extends HTMLAttributes<HTMLDivElement> {
  /** Names the group for assistive tech. Defaults to "Suggestions". */
  label?: string;
}

/** Row of suggested prompts. Chips fade in one after another. */
export const ChatSuggestions = forwardRef<HTMLDivElement, ChatSuggestionsProps>(
  function ChatSuggestions({ label = "Suggestions", className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        role="group"
        aria-label={label}
        className={cx("cherry-chat-suggestions", className)}
        {...rest}
      />
    );
  },
);

export interface ChatSuggestionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon before the text. */
  icon?: ReactNode;
}

/** A suggested prompt chip. Wire onClick to send its text. */
export const ChatSuggestion = forwardRef<
  HTMLButtonElement,
  ChatSuggestionProps
>(function ChatSuggestion({ icon, className, children, type, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cx("cherry-chat-suggestion", className)}
      {...rest}
    >
      {icon ? (
        <span className="cherry-chat-suggestion__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="cherry-chat-suggestion__label">{children}</span>
    </button>
  );
});
