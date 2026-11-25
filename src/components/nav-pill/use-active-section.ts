"use client";
import { useEffect, useState } from "react";

export interface ActiveSectionOptions {
  /**
   * The reading line, as a fraction of the viewport height from the top. The
   * active section is the last one whose top has scrolled above it. Defaults
   * to 0.3.
   */
  line?: number;
}

/**
 * Which of the given sections (element ids, in any order) is being read: the
 * last one whose top has passed the reading line, or null above the first.
 * At the very bottom of the page the last section on screen wins, so a short
 * final section can still become active.
 */
export function getActiveSection(
  ids: readonly string[],
  line = 0.3,
): string | null {
  if (typeof document === "undefined") return null;
  const view = window.innerHeight;
  const lineY = view * line;
  const tops: Array<{ id: string; top: number }> = [];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) tops.push({ id, top: el.getBoundingClientRect().top });
  }
  tops.sort((a, b) => a.top - b.top);

  const root = document.scrollingElement ?? document.documentElement;
  const atBottom =
    root.scrollHeight > view &&
    Math.ceil(root.scrollTop + view) >= root.scrollHeight - 2;
  let active: string | null = null;
  for (const { id, top } of tops) {
    if (top <= lineY || (atBottom && top < view)) active = id;
  }
  return active;
}

/**
 * Tracks which section the visitor is reading, for a table of contents or a
 * navigation that highlights in-page links. Pass the ids of the sections;
 * returns the active id, or null before the first one. Works with any scroll
 * container on the page.
 */
export function useActiveSection(
  ids: readonly string[],
  { line = 0.3 }: ActiveSectionOptions = {},
): string | null {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join("\n");

  useEffect(() => {
    const list = key ? key.split("\n") : [];
    if (list.length === 0) {
      setActive(null);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      setActive(getActiveSection(list, line));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    // Capture catches scrolling in any container, not only the window.
    document.addEventListener("scroll", schedule, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
    };
  }, [key, line]);

  return active;
}
