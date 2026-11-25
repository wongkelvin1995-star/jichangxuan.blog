import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/SectionHeading";
import { SearchClient } from "@/components/search/SearchClient";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "站内搜索",
  description: "搜索机场优选的全部已发布文章：按需选机场、机场测评、套餐比较、节点实测、使用教程与灵动云专区内容。搜索结果页不参与索引。",
  path: "/search/",
  noindex: true,
  follow: true,
});

export default function SearchPage() {
  return (
    <>
      <PageHeader kicker="Search" title="站内搜索" description="输入关键词即时匹配标题、摘要、标签与正文。索引在构建时生成，只包含已发布的内容。" />
      <div className="container-x max-w-3xl py-10">
        <Suspense fallback={<p className="text-sm text-muted">正在加载搜索…</p>}>
          <SearchClient />
        </Suspense>
      </div>
    </>
  );
}
