import type { ArticleSummary } from "@/lib/types";

import { ArticleCard } from "./ArticleCard";

/** 文章网格。放在已有 H2 的区块里时传 headingLevel="h3"，保持标题层级 */
export function ArticleList({
  articles,
  emptyText = "这个栏目还没有已发布的文章。",
  headingLevel = "h2",
}: {
  articles: ArticleSummary[];
  emptyText?: string;
  headingLevel?: "h2" | "h3";
}) {
  if (!articles.length) {
    return <p className="rounded-xl border border-dashed border-line bg-white p-8 text-center text-muted">{emptyText}</p>;
  }
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((a, i) => (
        <ArticleCard key={a.slug} article={a} headingLevel={headingLevel} eager={i === 0} />
      ))}
    </div>
  );
}
