import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/SectionHeading";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAllTags } from "@/lib/content";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "标签",
  description: "按标签浏览机场优选的文章：Clash、订阅、节点、延迟、套餐、优惠码、灵动云等。标签页为辅助导航，不参与索引。",
  path: "/tags/",
  noindex: true,
  follow: true,
});

export default function TagsPage() {
  const tags = getAllTags();
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "标签", path: "/tags/" }])} />
      <PageHeader kicker="Tags" title="按标签浏览" description="标签按文章数量排序，点击进入对应的文章列表。">
        <Breadcrumbs items={[{ name: "标签", path: "/tags/" }]} className="mt-6" />
      </PageHeader>
      <div className="container-x py-10">
        <ul className="flex flex-wrap gap-3">
          {tags.map((t) => (
            <li key={t.tag}>
              <Link href={`/tags/${encodeURIComponent(t.tag)}/`} className="card card-hover inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink">
                #{t.tag}
                <span className="rounded-full bg-sky-soft px-2 text-xs text-brand-deep">{t.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
