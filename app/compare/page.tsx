import type { Metadata } from "next";

import { CategoryListing } from "@/components/category/CategoryListing";
import { CompareExtras } from "@/components/compare/CompareExtras";
import { buildMetadata } from "@/lib/seo";
import { getCategory } from "@/lib/site";

/**
 * /compare/ 栏目首页单独成页（与 /lingdongyun/ 相同做法），只有这里加载套餐筛选组件的客户端脚本。
 * 文章 /compare/<slug>/ 与分页 /compare/page/<n>/ 仍由 app/[category]/[...rest] 生成，URL 不变。
 */
const meta = getCategory("compare")!;

export const metadata: Metadata = buildMetadata({ title: meta.seoTitle, description: meta.seoDescription, path: meta.path });

export default function ComparePage() {
  return <CategoryListing category={meta} page={1} extras={<CompareExtras />} />;
}
