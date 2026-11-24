import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../../utils/cx";
import type { ChatMessageRole } from "./variants.gen";

export interface ChatMessageProps extends HTMLAttributes<HTMLDivElement> {
  /** user: a right-aligned bubble; assistant: a full-width reply. Defaults to "assistant". */
  role?: ChatMessageRole;
  /** Beside the message, typically an <Avatar size="sm">. */
  avatar?: ReactNode;
  /** Row under the message (copy, retry...), typically small IconButtons. */
  actions?: ReactNode;
  /** Shows a blinking caret after the text while a reply streams in. */
  streaming?: boolean;
  /** Skip the entrance animation (messages restored from history). */
  still?: boolean;
}

/**
 * One chat turn. Messages animate in (the user bubble grows from its
 * corner, the reply rises and its avatar pops), then the action row fades
 * in. No client JS.
 */
export const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  function ChatMessage(
    {
      role = "assistant",
      avatar,
      actions,
      streaming,
      still,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cx("cherry-chat-message", className)}
        data-role={role}
        data-streaming={streaming || undefined}
        data-still={still || undefined}
        aria-busy={streaming || undefined}
        {...rest}
      >
        {avatar ? (
          <span className="cherry-chat-message__avatar">{avatar}</span>
        ) : null}
        <div className="cherry-chat-message__main">
          <div className="cherry-chat-message__content">{children}</div>
          {actions ? (
            <div className="cherry-chat-message__actions">{actions}</div>
          ) : null}
        </div>
      </div>
    );
  },
);
