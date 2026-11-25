"use client";

import { ChevronDown } from "lucide-react";
import { useId, useRef, useState } from "react";

import type { FaqItem } from "@/lib/types";

/**
 * 无障碍折叠面板：按钮 + aria-expanded/aria-controls，
 * 支持 ↑ ↓ Home End 在问题之间移动，Enter / Space 展开收起（按钮原生行为）。
 */
export function Faq({ items, defaultOpen = 0 }: { items: FaqItem[]; defaultOpen?: number | null }) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen);
  const baseId = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const count = items.length;
    let target: number | null = null;
    if (e.key === "ArrowDown") target = (i + 1) % count;
    else if (e.key === "ArrowUp") target = (i - 1 + count) % count;
    else if (e.key === "Home") target = 0;
    else if (e.key === "End") target = count - 1;
    if (target !== null) {
      e.preventDefault();
      buttons.current[target]?.focus();
    }
  };

  return (
    <div className="divide-y divide-line-soft rounded-2xl border border-line bg-white">
      {items.map((item, i) => {
        const open = openIndex === i;
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;
        return (
          <div key={item.q}>
            <h3 className="m-0">
              <button
                id={buttonId}
                ref={(el) => {
                  buttons.current[i] = el;
                }}
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-ink transition-colors hover:text-brand-strong"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : i)}
                onKeyDown={(e) => onKeyDown(e, i)}
              >
                <span>{item.q}</span>
                <ChevronDown size={18} aria-hidden="true" className="faq-icon shrink-0 text-muted" data-open={open} />
              </button>
            </h3>
            {/* 不设 role="region"：每个答案都成为地标会让页面地标过多；收起时由 CSS 设为 visibility:hidden，读屏不会读到 */}
            <div id={panelId} className="faq-panel" data-open={open}>
              <div>
                <p className="px-5 pb-5 text-[0.95rem] leading-relaxed text-ink-soft">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
