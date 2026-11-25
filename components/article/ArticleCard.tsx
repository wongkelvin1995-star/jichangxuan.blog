import { CalendarDays, Clock } from "lucide-react";
import Link from "next/link";

import { formatDate } from "@/lib/format";
import type { ArticleSummary } from "@/lib/types";

type Variant = "large" | "default" | "compact";

interface ArticleCardProps {
  article: ArticleSummary;
  variant?: Variant;
  /** 首屏大图用 eager + 高优先级，其余懒加载 */
  priority?: boolean;
  /** 只要求立即加载、不提高优先级（列表页第一张卡片） */
  eager?: boolean;
  headingLevel?: "h2" | "h3";
  /** 测评专区：摘要完整显示，不截成三行 */
  fullDescription?: boolean;
}

/**
 * 文章卡片：每张卡片只有一条链接（标题），用 .stretched-link 让整张卡片可点击。
 * 封面是装饰图（alt 为空），不再单独包一层没有文字的链接。
 */
export function ArticleCard({ article, variant = "default", priority = false, eager = false, headingLevel = "h3", fullDescription = false }: ArticleCardProps) {
  const Heading = headingLevel;
  const imgProps = priority
    ? { loading: "eager" as const, fetchPriority: "high" as const }
    : eager
      ? { loading: "eager" as const, decoding: "async" as const }
      : { loading: "lazy" as const, decoding: "async" as const };

  if (variant === "compact") {
    return (
      <article className="card card-hover relative flex gap-4 p-3">
        <div className="card-media w-28 shrink-0 overflow-hidden rounded-lg">
          <img src={article.cover} alt="" width={1200} height={630} {...imgProps} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="chip">{article.categoryLabel}</span>
          <Heading className="mt-1.5 line-clamp-2 text-[0.95rem] font-semibold leading-snug">
            <Link href={article.path} className="stretched-link text-ink transition-colors hover:text-brand-strong">
              {article.title}
            </Link>
          </Heading>
          <p className="mt-1 text-xs text-muted">
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          </p>
        </div>
      </article>
    );
  }

  const large = variant === "large";
  return (
    <article className={`card card-hover relative flex h-full flex-col overflow-hidden ${large ? "lg:flex-row" : ""}`}>
      <div className={`card-media block shrink-0 ${large ? "lg:w-[55%]" : ""}`}>
        <img src={article.cover} alt="" width={1200} height={630} {...imgProps} />
      </div>
      <div className={`flex flex-1 flex-col ${large ? "p-6 lg:p-8" : "p-5"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip">{article.categoryLabel}</span>
        </div>
        <Heading className={`mt-3 font-bold leading-snug ${large ? "text-2xl lg:text-[1.75rem]" : "text-lg"}`}>
          <Link href={article.path} className="stretched-link text-ink transition-colors hover:text-brand-strong">
            {article.title}
          </Link>
        </Heading>
        <p className={`mt-2 text-muted ${large ? "text-base" : fullDescription ? "text-sm" : "line-clamp-3 text-sm"}`}>{article.description}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={14} aria-hidden="true" />
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={14} aria-hidden="true" />
            约 {article.readingMinutes} 分钟
          </span>
        </div>
      </div>
    </article>
  );
}
