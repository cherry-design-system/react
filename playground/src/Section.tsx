import type { ReactNode } from "react";

/** One component demo. `id` becomes #anchor for screenshots. */
export function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section
      className="pg-section"
      id={id ?? title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
    >
      <h2>{title}</h2>
      {children}
    </section>
  );
}
