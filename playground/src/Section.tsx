import type { ReactNode } from "react";
import { previewName, previewQuery, sectionId } from "./preview";

/**
 * One component demo. Its id (from the title) is the #anchor and the
 * /preview/<id> route: on a preview route only the matching section renders,
 * centered in #preview-box; on the /preview index each section is a link.
 */
export function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: ReactNode;
}) {
  const anchor = id ?? sectionId(title);
  if (previewName === "") {
    return (
      <li>
        <a href={`/preview/${anchor}${previewQuery}`}>{title}</a>
      </li>
    );
  }
  if (previewName !== null) {
    if (previewName !== anchor) return null;
    return (
      <div id="preview-box" className="pg-preview-box">
        {children}
      </div>
    );
  }
  return (
    <section className="pg-section" id={anchor}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
