"use client";

import { useEffect, useState } from "react";

import type { TocItem } from "@/lib/types";

/** 自动目录：点击跳转到对应标题，并随滚动高亮当前章节 */
export function TocList({ items, onNavigate }: { items: TocItem[]; onNavigate?: () => void }) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (!items.length || typeof IntersectionObserver === "undefined") return;
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => !!el);
    if (!headings.length) return;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
          else visible.delete(entry.target.id);
        }
        if (visible.size) {
          const top = [...visible.entries()].sort((a, b) => a[1] - b[1])[0][0];
          setActive(top);
        }
      },
      { rootMargin: "-88px 0px -65% 0px", threshold: [0, 1] },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <ol className="space-y-0.5">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            className="toc-link"
            data-depth={item.depth}
            data-active={active === item.id}
            onClick={onNavigate}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  );
}
