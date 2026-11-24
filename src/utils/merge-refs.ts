import type { Ref } from "react";

/** Writes `value` to a callback or object ref. */
export function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

/** One callback ref that writes to every given ref. */
export function mergeRefs<T>(
  ...refs: Array<Ref<T> | undefined>
): (value: T | null) => void {
  return (value) => {
    for (const ref of refs) assignRef(ref, value);
  };
}
