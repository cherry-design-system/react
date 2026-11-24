import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../utils/cx";

export type ModalBodyProps = HTMLAttributes<HTMLDivElement>;
export type ModalFooterProps = HTMLAttributes<HTMLDivElement>;

/** Scrolling content area of a <Modal>. */
export const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(
  function ModalBody({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cx("cherry-modal__body", className)}
        {...rest}
      />
    );
  },
);

/** Action row at the bottom of a <Modal>, aligned to the end. */
export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  function ModalFooter({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cx("cherry-modal__footer", className)}
        {...rest}
      />
    );
  },
);
