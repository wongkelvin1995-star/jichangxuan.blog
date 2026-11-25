import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleList } from "@/components/article/ArticleList";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/SectionHeading";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAllTags, getArticlesByTag, toSummary } from "@/lib/content";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

type Params = { tag: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getAllTags().map((t) => ({ tag: t.tag }));
}

function decode(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const tag = decode((await params).tag);
  const articles = getArticlesByTag(tag);
  if (!articles.length) return { title: "页面不存在", robots: { index: false, follow: false } };
  return buildMetadata({
    title: `标签：${tag}`,
    description: `机场优选中带有“${tag}”标签的 ${articles.length} 篇文章，涵盖按需选机场、套餐比较、节点实测、使用教程与灵动云专区。标签页为辅助导航，不参与搜索引擎索引。`,
    path: `/tags/${encodeURIComponent(tag)}/`,
    noindex: true,
    follow: true,
  });
}

export default async function TagPage({ params }: { params: Promise<Params> }) {
  const tag = decode((await params).tag);
  const articles = getArticlesByTag(tag);
  if (!articles.length) notFound();
  const path = `/tags/${encodeURIComponent(tag)}/`;
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "标签", path: "/tags/" }, { name: tag, path }])} />
      <PageHeader kicker="Tag" title={`标签：${tag}`} description={`共 ${articles.length} 篇文章。`}>
        <Breadcrumbs items={[{ name: "标签", path: "/tags/" }, { name: tag, path }]} className="mt-6" />
      </PageHeader>
      <div className="container-x py-10 md:py-14">
        <ArticleList articles={articles.map(toSummary)} />
      </div>
    </>
  );
}
