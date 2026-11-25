import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleLayout } from "@/components/article/ArticleLayout";
import { CategoryListing } from "@/components/category/CategoryListing";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  canShowDrafts,
  categoryPerPage,
  getAllArticlesIncludingDrafts,
  getArticle,
  getArticlesByCategory,
  getPrevNext,
  getPublishedArticles,
  getRelatedArticles,
  paginate,
  toSummary,
} from "@/lib/content";
import { articleJsonLd, breadcrumbJsonLd, buildMetadata, faqJsonLd, ogImageForArticle } from "@/lib/seo";
import { CATEGORIES, getCategory } from "@/lib/site";

/**
 * 栏目下的两类路径由同一个通配路由处理（静态导出要求每个动态路由至少生成一个路径）：
 *  - /<category>/<slug>/        文章页
 *  - /<category>/page/<n>/      栏目分页（n ≥ 2；第 1 页就是栏目根路径）
 */
type Params = { category: string; rest: string[] };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  const out: Params[] = [];
  const list = canShowDrafts() ? getAllArticlesIncludingDrafts() : getPublishedArticles();
  for (const a of list) out.push({ category: a.frontmatter.category, rest: [a.frontmatter.slug] });
  for (const c of CATEGORIES) {
    const { totalPages } = paginate(getArticlesByCategory(c.id), 1, categoryPerPage(c.id));
    for (let p = 2; p <= totalPages; p++) out.push({ category: c.id, rest: ["page", String(p)] });
  }
  return out;
}

type Resolved = { kind: "article"; slug: string } | { kind: "page"; page: number } | null;

function resolve(rest: string[]): Resolved {
  if (rest.length === 1) return { kind: "article", slug: rest[0] };
  if (rest.length === 2 && rest[0] === "page" && /^\d+$/.test(rest[1]) && Number(rest[1]) >= 2) {
    return { kind: "page", page: Number(rest[1]) };
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category, rest } = await params;
  const meta = getCategory(category);
  const r = resolve(rest);
  const notFoundMeta: Metadata = { title: "页面不存在", robots: { index: false, follow: false } };
  if (!meta || !r) return notFoundMeta;

  if (r.kind === "page") {
    return buildMetadata({
      title: `${meta.label}（第 ${r.page} 页）`,
      description: `${meta.seoDescription} 第 ${r.page} 页。`,
      path: `${meta.path}page/${r.page}/`,
    });
  }

  const article = getArticle(category, r.slug);
  if (!article) return notFoundMeta;
  const fm = article.frontmatter;
  return buildMetadata({
    title: fm.seoTitle ?? fm.title,
    description: fm.description,
    path: article.path,
    type: "article",
    publishedTime: fm.publishedAt,
    modifiedTime: fm.updatedAt,
    noindex: fm.draft || !!fm.noindex,
    image: ogImageForArticle(fm),
  });
}

export default async function CategoryRestPage({ params }: { params: Promise<Params> }) {
  const { category, rest } = await params;
  const meta = getCategory(category);
  const r = resolve(rest);
  if (!meta || !r) notFound();

  if (r.kind === "page") {
    const { totalPages } = paginate(getArticlesByCategory(meta.id), 1, categoryPerPage(meta.id));
    if (r.page > totalPages) notFound();
    return <CategoryListing category={meta} page={r.page} />;
  }

  const article = getArticle(category, r.slug);
  if (!article) notFound();
  const related = getRelatedArticles(article, 4).map(toSummary);
  const { prev, next } = getPrevNext(article);

  return (
    <>
      <JsonLd
        data={[
          articleJsonLd(article),
          breadcrumbJsonLd([
            { name: meta.label, path: meta.path },
            { name: article.frontmatter.title, path: article.path },
          ]),
          faqJsonLd(article.frontmatter.faq),
        ]}
      />
      <ArticleLayout article={article} related={related} prev={prev ? toSummary(prev) : undefined} next={next ? toSummary(next) : undefined} />
    </>
  );
}
