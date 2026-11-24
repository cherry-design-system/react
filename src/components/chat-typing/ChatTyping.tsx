import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../../utils/cx";

export interface ChatTypingProps extends HTMLAttributes<HTMLDivElement> {
  /** Text after the dots. Defaults to "Thinking…". */
  children?: ReactNode;
  /**
   * Keep it mounted and toggle this to let it fade and fold away (and back)
   * instead of popping out. Defaults to true.
   */
  active?: boolean;
}

/** "The assistant is answering": three bouncing dots and a label. No client JS. */
export const ChatTyping = forwardRef<HTMLDivElement, ChatTypingProps>(
  function ChatTyping(
    { children = "Thinking…", active = true, className, ...rest },
    ref,
  ) {
    return (
      <div
        ref={ref}
        role="status"
        className={cx("cherry-chat-typing", className)}
        data-active={active || undefined}
        aria-hidden={active ? undefined : true}
        {...rest}
      >
        <span className="cherry-chat-typing__inner">
          <span className="cherry-chat-typing__dots" aria-hidden="true">
            <span className="cherry-chat-typing__dot" />
            <span className="cherry-chat-typing__dot" />
            <span className="cherry-chat-typing__dot" />
          </span>
          {active ? (
            <span className="cherry-chat-typing__label">{children}</span>
          ) : null}
        </span>
      </div>
    );
  },
);
