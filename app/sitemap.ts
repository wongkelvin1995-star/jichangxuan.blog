import type { MetadataRoute } from "next";

import { getPublishedBrands } from "@/lib/brands";
import { categoryPerPage, getArticlesByCategory, getCategoryLastModified, getPublishedArticles, paginate } from "@/lib/content";
import { articlesLastModified, categoryLastModified, pageLastModified } from "@/lib/lastmod";
import { ARTICLES_PER_PAGE, CATEGORIES, SITE, STATIC_PAGES, absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

/**
 * Sitemap 规则：
 *  - 只列出已发布、允许索引、返回 200 的规范 URL（带结尾斜杠）。
 *  - 草稿、搜索页、标签页（noindex）、未发布品牌不进入。
 *  - lastmod 由 lib/lastmod.ts 按页面实际依赖的数据计算（IndexNow 增量提交与站内搜索日期共用同一规则）。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const p of STATIC_PAGES) {
    entries.push({
      url: absoluteUrl(p.path),
      lastModified: pageLastModified(p.path),
      changeFrequency: p.path === "/" ? "weekly" : "monthly",
      priority: p.priority,
    });
  }

  for (const c of CATEGORIES) {
    entries.push({
      url: absoluteUrl(c.path),
      lastModified: categoryLastModified(c.id),
      changeFrequency: "weekly",
      priority: 0.8,
    });
    const { totalPages } = paginate(getArticlesByCategory(c.id), 1, categoryPerPage(c.id));
    for (let page = 2; page <= totalPages; page++) {
      entries.push({
        url: absoluteUrl(`${c.path}page/${page}/`),
        lastModified: getCategoryLastModified(c.id) ?? SITE.launchedAt,
        changeFrequency: "weekly",
        priority: 0.4,
      });
    }
  }

  for (const b of getPublishedBrands()) {
    if (b.hubPath) continue; // 专题页已在栏目列表中
    const path = `/brands/${b.slug}/`;
    entries.push({ url: absoluteUrl(path), lastModified: pageLastModified(path), changeFrequency: "monthly", priority: 0.6 });
  }

  const all = getPublishedArticles();
  const { totalPages } = paginate(all, 1, ARTICLES_PER_PAGE);
  for (let page = 2; page <= totalPages; page++) {
    entries.push({ url: absoluteUrl(`/articles/page/${page}/`), lastModified: articlesLastModified(), changeFrequency: "weekly", priority: 0.4 });
  }

  for (const a of all) {
    if (a.frontmatter.noindex) continue;
    entries.push({
      url: absoluteUrl(a.path),
      lastModified: a.frontmatter.updatedAt,
      changeFrequency: a.frontmatter.category === "speedtest" && a.frontmatter.test ? "yearly" : "monthly",
      priority: a.frontmatter.featured ? 0.8 : 0.7,
    });
  }

  return entries;
}
