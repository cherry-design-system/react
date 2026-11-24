import {
  forwardRef,
  type AnchorHTMLAttributes,
  type HTMLAttributes,
} from "react";
import { cx } from "../../utils/cx";

export interface ChatSourcesProps extends HTMLAttributes<HTMLOListElement> {
  /** Names the list for assistive tech. Defaults to "Sources". */
  label?: string;
}

/** Numbered list of sources under a reply. Chips fade in one after another. */
export const ChatSources = forwardRef<HTMLOListElement, ChatSourcesProps>(
  function ChatSources({ label = "Sources", className, ...rest }, ref) {
    return (
      <ol
        ref={ref}
        className={cx("cherry-chat-sources", className)}
        aria-label={label}
        {...rest}
      />
    );
  },
);

export type ChatSourceProps = AnchorHTMLAttributes<HTMLAnchorElement>;

/**
 * One source chip: a link with its number in a circle (a CSS counter, so
 * the order is the list order).
 */
export const ChatSource = forwardRef<HTMLAnchorElement, ChatSourceProps>(
  function ChatSource({ className, children, ...rest }, ref) {
    return (
      <li className="cherry-chat-sources__item">
        <a ref={ref} className={cx("cherry-chat-source", className)} {...rest}>
          <span className="cherry-chat-source__label">{children}</span>
        </a>
      </li>
    );
  },
);
