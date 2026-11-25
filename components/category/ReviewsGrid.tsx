"use client";

import { useState } from "react";

import { ArticleCard } from "@/components/article/ArticleCard";
import type { ReviewCard } from "@/lib/reviews";

/**
 * 测评专区文章网格与筛选。所有卡片都在服务端 HTML 里（爬虫能读到全部链接），
 * 筛选只在浏览器里按文章的真实标签隐藏不匹配的卡片。
 */
export function ReviewsGrid({ reviews, filters }: { reviews: ReviewCard[]; filters: readonly string[] }) {
  const [active, setActive] = useState<string>("全部测评");
  const options = ["全部测评", ...filters.filter((f) => reviews.some((r) => r.filters.includes(f)))];
  const visible = reviews.filter((r) => active === "全部测评" || r.filters.includes(active));

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="按测评重点筛选">
        {options.map((o) => {
          const count = o === "全部测评" ? reviews.length : reviews.filter((r) => r.filters.includes(o)).length;
          const on = active === o;
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => setActive(o)}
              className={`chip cursor-pointer transition-colors ${on ? "border-brand bg-brand text-white" : "hover:bg-sky"}`}
            >
              {o}
              <span className={on ? "text-white/80" : "text-muted"}>（{count}）</span>
            </button>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        当前显示 {visible.length} 篇
      </p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r, i) => (
          <div key={r.slug} hidden={!visible.includes(r)} className="h-full">
            <ArticleCard article={r} headingLevel="h3" eager={i === 0} fullDescription />
          </div>
        ))}
      </div>
    </>
  );
}
