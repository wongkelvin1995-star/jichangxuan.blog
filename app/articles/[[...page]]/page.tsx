import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticlesListing } from "@/components/category/ArticlesListing";
import { getPublishedArticles, paginate } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { ARTICLES_PER_PAGE } from "@/lib/site";

/**
 * /articles/             全部文章第 1 页
 * /articles/page/<n>/    第 n 页（n ≥ 2）
 * 用可选通配路由，保证静态导出时至少生成根路径。
 */
type Params = { page?: string[] };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  const { totalPages } = paginate(getPublishedArticles(), 1, ARTICLES_PER_PAGE);
  const out: Params[] = [{ page: [] }];
  for (let p = 2; p <= totalPages; p++) out.push({ page: ["page", String(p)] });
  return out;
}

function resolvePage(segments: string[] | undefined): number | null {
  if (!segments || segments.length === 0) return 1;
  if (segments.length === 2 && segments[0] === "page" && /^\d+$/.test(segments[1]) && Number(segments[1]) >= 2) {
    return Number(segments[1]);
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const n = resolvePage((await params).page);
  if (!n) return { title: "页面不存在", robots: { index: false, follow: false } };
  const all = getPublishedArticles();
  if (n === 1) {
    return buildMetadata({
      title: "全部文章：机场推荐、测评、套餐比较与客户端教程",
      description: `机场优选已发布的 ${all.length} 篇文章，按发布日期倒序排列：按需选机场、灵动云测评与测试记录、套餐比较、节点知识与客户端使用教程。`,
      path: "/articles/",
    });
  }
  const { items } = paginate(all, n, ARTICLES_PER_PAGE);
  const sample = items
    .slice(0, 2)
    .map((a) => `《${a.frontmatter.title}》`)
    .join("、");
  return buildMetadata({
    title: `全部文章（第 ${n} 页）`,
    description: `全部文章第 ${n} 页，按发布日期倒序：本页收录 ${items.length} 篇，包括${sample}等。`.slice(0, 160),
    path: `/articles/page/${n}/`,
  });
}

export default async function ArticlesPage({ params }: { params: Promise<Params> }) {
  const n = resolvePage((await params).page);
  if (!n) notFound();
  const { totalPages } = paginate(getPublishedArticles(), 1, ARTICLES_PER_PAGE);
  if (n > totalPages) notFound();
  return <ArticlesListing page={n} />;
}
