import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryListing } from "@/components/category/CategoryListing";
import { buildMetadata } from "@/lib/seo";
import { CATEGORIES, getCategory } from "@/lib/site";

type Params = { category: string };

export const dynamicParams = false;

/**
 * 灵动云专区（app/lingdongyun/page.tsx）与套餐比较（app/compare/page.tsx）有独立的静态页面，
 * 这里只生成其余四个栏目。
 */
const OWN_PAGE = new Set(["lingdongyun", "compare"]);

export function generateStaticParams(): Params[] {
  return CATEGORIES.filter((c) => !OWN_PAGE.has(c.id)).map((c) => ({ category: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category } = await params;
  const meta = getCategory(category);
  if (!meta) return { title: "页面不存在", robots: { index: false, follow: false } };
  return buildMetadata({ title: meta.seoTitle, description: meta.seoDescription, path: meta.path });
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { category } = await params;
  const meta = getCategory(category);
  if (!meta || OWN_PAGE.has(meta.id)) notFound();
  return <CategoryListing category={meta} page={1} />;
}
