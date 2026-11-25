import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ArticleCard } from "@/components/article/ArticleCard";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { CATEGORIES } from "@/lib/site";
import type { ArticleSummary } from "@/lib/types";

/**
 * 首页 H2「最新机场测评与原创文章」：服务端渲染的文章网格（不再用客户端标签页），
 * 栏目入口是普通链接，搜索引擎可以直接跟踪。
 */
export function LatestArticles({ featured, latest, total }: { featured: ArticleSummary[]; latest: ArticleSummary[]; total: number }) {
  const [first, ...restFeatured] = featured;
  const shownSlugs = new Set(featured.map((a) => a.slug));
  const more = latest.filter((a) => !shownSlugs.has(a.slug)).slice(0, 6);
  return (
    <section id="latest" className="container-x scroll-mt-24 py-12 md:py-16" aria-labelledby="latest-title">
      <SectionHeading
        id="latest-title"
        kicker="Latest"
        title="最新机场测评与原创文章"
        description={`已发布 ${total} 篇原创文章：选购方法、灵动云测评与测试记录、套餐比较、节点知识和客户端教程。测试类文章都注明日期、出口节点与局限。`}
        link={{ label: `全部 ${total} 篇文章`, href: "/articles/" }}
      />
      <nav aria-label="文章栏目" className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Link key={c.id} href={c.path} className="chip chip-outline min-h-8 px-3 hover:border-brand hover:text-brand-strong">
            {c.label}
          </Link>
        ))}
      </nav>
      {first && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ArticleCard article={first} variant="large" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            {restFeatured.slice(0, 2).map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </div>
      )}
      {more.length > 0 && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {more.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      )}
      <div className="mt-8 flex justify-center">
        <Link href="/articles/" className="btn btn-secondary">
          浏览全部文章
          <ArrowRight size={16} aria-hidden="true" className="btn-arrow" />
        </Link>
      </div>
    </section>
  );
}
