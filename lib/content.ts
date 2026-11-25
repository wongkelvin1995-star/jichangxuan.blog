import fs from "node:fs";
import path from "node:path";

import GithubSlugger from "github-slugger";
import matter from "gray-matter";

import { BRANDS } from "./brands";
import { CHANGELOG } from "./changelog";
import { maxDate } from "./format";
import { articleFrontmatterSchema, normalizeFrontmatterDates } from "./schemas";
import { ARTICLES_PER_PAGE, CATEGORY_IDS, STATIC_PAGES, getCategory } from "./site";
import type { Article, ArticleFrontmatter, ArticleSummary, CategoryId, TocItem } from "./types";

export const CONTENT_ROOT = path.join(process.cwd(), "content");

/**
 * 草稿可见性：
 *  - 开发环境或 CONTENT_PREVIEW=true：草稿可通过直接地址访问（带 noindex 与草稿横幅），但不进入列表、搜索与 sitemap
 *  - 生产构建：草稿不生成页面（404），不进入 sitemap
 */
export function canShowDrafts(): boolean {
  return process.env.NODE_ENV === "development" || process.env.CONTENT_PREVIEW === "true";
}

export function extractToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger();
  const toc: TocItem[] = [];
  let inFence = false;
  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trimEnd();
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const depth = m[1].length as 2 | 3;
    // 与 rehype-slug 看到的文字保持一致：去掉链接语法、HTML 标签与强调符号
    const text = m[2]
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/<[^>]+>/g, "")
      .replace(/[*_`]/g, "")
      .trim();
    toc.push({ id: slugger.slug(text), text, depth });
  }
  return toc;
}

export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|]+/g, " ")
    .replace(/^\s*[-:]+\s*$/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countChars(markdown: string): number {
  return stripMarkdown(markdown).replace(/\s+/g, "").length;
}

function loadCategoryDir(category: CategoryId): Article[] {
  const dir = path.join(CONTENT_ROOT, category);
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .sort();
  const articles: Article[] = [];
  for (const file of files) {
    const rel = `content/${category}/${file}`;
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const { data, content } = matter(raw);
    const parsed = articleFrontmatterSchema.safeParse(normalizeFrontmatterDates(data));
    if (!parsed.success) {
      throw new Error(`${rel} 的 frontmatter 不合法：${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("；")}`);
    }
    const fm = parsed.data as ArticleFrontmatter;
    const expectedSlug = file.replace(/\.mdx?$/, "");
    if (fm.slug !== expectedSlug) {
      throw new Error(`${rel}：frontmatter.slug（${fm.slug}）必须与文件名一致`);
    }
    if (fm.category !== category) {
      throw new Error(`${rel}：frontmatter.category（${fm.category}）必须与目录名一致`);
    }
    const charCount = countChars(content);
    articles.push({
      frontmatter: fm,
      body: content,
      toc: extractToc(content),
      charCount,
      readingMinutes: Math.max(1, Math.round(charCount / 400)),
      path: `/${category}/${fm.slug}/`,
      file: rel,
    });
  }
  return articles;
}

let cache: Article[] | null = null;

export function loadAllArticles(): Article[] {
  if (cache && process.env.NODE_ENV === "production") return cache;
  const all = CATEGORY_IDS.flatMap((c) => loadCategoryDir(c));
  const seen = new Map<string, string>();
  for (const a of all) {
    const prev = seen.get(a.frontmatter.slug);
    if (prev) throw new Error(`slug 重复：${a.file} 与 ${prev}（slug 必须全站唯一）`);
    seen.set(a.frontmatter.slug, a.file);
  }
  cache = all;
  return all;
}

function byDateDesc(a: Article, b: Article): number {
  const d = b.frontmatter.publishedAt.localeCompare(a.frontmatter.publishedAt);
  return d !== 0 ? d : a.frontmatter.title.localeCompare(b.frontmatter.title, "zh-CN");
}

/** 已发布（非草稿）的文章，按发布日期倒序 */
export function getPublishedArticles(): Article[] {
  return loadAllArticles()
    .filter((a) => !a.frontmatter.draft)
    .sort(byDateDesc);
}

/** 仅供校验脚本与开发环境：含草稿 */
export function getAllArticlesIncludingDrafts(): Article[] {
  return loadAllArticles().slice().sort(byDateDesc);
}

export function getArticle(category: string, slug: string): Article | undefined {
  const a = loadAllArticles().find((x) => x.frontmatter.category === category && x.frontmatter.slug === slug);
  if (!a) return undefined;
  if (a.frontmatter.draft && !canShowDrafts()) return undefined;
  return a;
}

export function getArticleBySlug(slug: string): Article | undefined {
  const a = loadAllArticles().find((x) => x.frontmatter.slug === slug);
  if (!a) return undefined;
  if (a.frontmatter.draft && !canShowDrafts()) return undefined;
  return a;
}

export function getArticlesByCategory(category: CategoryId): Article[] {
  return getPublishedArticles().filter((a) => a.frontmatter.category === category);
}

export function getFeaturedArticles(limit = 3): Article[] {
  const published = getPublishedArticles();
  const featured = published
    .filter((a) => a.frontmatter.featured)
    .sort((a, b) => (a.frontmatter.featuredOrder ?? 99) - (b.frontmatter.featuredOrder ?? 99));
  const rest = published.filter((a) => !a.frontmatter.featured);
  return [...featured, ...rest].slice(0, limit);
}

export function getLatestArticles(limit = ARTICLES_PER_PAGE): Article[] {
  return getPublishedArticles().slice(0, limit);
}

export function getRelatedArticles(article: Article, limit = 4): Article[] {
  const pool = getPublishedArticles().filter((a) => a.frontmatter.slug !== article.frontmatter.slug);
  const explicit = article.frontmatter.related
    .map((slug) => pool.find((a) => a.frontmatter.slug === slug))
    .filter((a): a is Article => !!a);
  const tagSet = new Set(article.frontmatter.tags);
  const scored = pool
    .filter((a) => !explicit.includes(a))
    .map((a) => {
      let score = a.frontmatter.tags.filter((t) => tagSet.has(t)).length * 2;
      if (a.frontmatter.category === article.frontmatter.category) score += 1;
      if (article.frontmatter.brand && a.frontmatter.brand === article.frontmatter.brand) score += 1;
      return { a, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .map((x) => x.a);
  return [...explicit, ...scored].slice(0, limit);
}

/** 同栏目内的上一篇（更早）与下一篇（更新） */
export function getPrevNext(article: Article): { prev?: Article; next?: Article } {
  const list = getArticlesByCategory(article.frontmatter.category).slice().reverse(); // 升序
  const idx = list.findIndex((a) => a.frontmatter.slug === article.frontmatter.slug);
  if (idx === -1) return {};
  return { prev: list[idx - 1], next: list[idx + 1] };
}

export function getAllTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const a of getPublishedArticles()) {
    for (const t of a.frontmatter.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((x, y) => y.count - x.count || x.tag.localeCompare(y.tag, "zh-CN"));
}

export function getArticlesByTag(tag: string): Article[] {
  return getPublishedArticles().filter((a) => a.frontmatter.tags.includes(tag));
}

/** 栏目每页篇数：测评专区把 12 家测评放在同一页（按站长指定顺序），其余栏目沿用 ARTICLES_PER_PAGE */
export function categoryPerPage(categoryId: string): number {
  return categoryId === "reviews" ? 24 : ARTICLES_PER_PAGE;
}

export function paginate<T>(items: T[], page: number, perPage = ARTICLES_PER_PAGE) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const current = Math.min(Math.max(1, page), totalPages);
  return {
    items: items.slice((current - 1) * perPage, current * perPage),
    page: current,
    totalPages,
    total: items.length,
  };
}

export function toSummary(a: Article): ArticleSummary {
  const cat = getCategory(a.frontmatter.category);
  return {
    title: a.frontmatter.title,
    slug: a.frontmatter.slug,
    description: a.frontmatter.description,
    category: a.frontmatter.category,
    categoryLabel: cat?.label ?? a.frontmatter.category,
    path: a.path,
    cover: a.frontmatter.cover,
    coverAlt: a.frontmatter.coverAlt ?? `${a.frontmatter.title} 封面图`,
    publishedAt: a.frontmatter.publishedAt,
    updatedAt: a.frontmatter.updatedAt,
    readingMinutes: a.readingMinutes,
    tags: a.frontmatter.tags,
  };
}

/** 栏目最近更新日期（取该栏目已发布文章的最大 updatedAt） */
export function getCategoryLastModified(category: CategoryId): string | undefined {
  return maxDate(getArticlesByCategory(category).map((a) => a.frontmatter.updatedAt));
}

/** 全站内容最近更新日期：文章 updatedAt、静态页面登记日期、品牌数据与更新记录中最大者 */
export function getSiteLastModified(): string {
  return (
    maxDate([
      ...getPublishedArticles().map((a) => a.frontmatter.updatedAt),
      ...STATIC_PAGES.map((p) => p.lastmod),
      ...BRANDS.filter((b) => b.published).map((b) => b.updatedAt),
      CHANGELOG[0]?.date,
    ]) ?? "2026-11-12"
  );
}

export interface SearchDoc {
  title: string;
  description: string;
  path: string;
  category: CategoryId | "page";
  categoryLabel: string;
  tags: string[];
  excerpt: string;
  date: string;
}

export function buildSearchIndex(extraPages: SearchDoc[] = []): SearchDoc[] {
  const docs: SearchDoc[] = getPublishedArticles().map((a) => {
    const cat = getCategory(a.frontmatter.category);
    return {
      title: a.frontmatter.title,
      description: a.frontmatter.description,
      path: a.path,
      category: a.frontmatter.category,
      categoryLabel: cat?.label ?? a.frontmatter.category,
      tags: a.frontmatter.tags,
      excerpt: stripMarkdown(a.body).slice(0, 600),
      date: a.frontmatter.updatedAt,
    };
  });
  return [...docs, ...extraPages];
}

/** 测速类文章：按地区归并（用于首页与节点实测页的地区模块） */
export function getSpeedtestReportsByRegion(): Map<string, Article[]> {
  const map = new Map<string, Article[]>();
  for (const a of getArticlesByCategory("speedtest")) {
    if (!a.frontmatter.test) continue;
    for (const r of a.frontmatter.regions ?? []) {
      const list = map.get(r) ?? [];
      list.push(a);
      map.set(r, list);
    }
  }
  return map;
}
