import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import { extractToc, stripMarkdown } from "./content";
import { maxDate } from "./format";
import { brandEditorialSchema, normalizeFrontmatterDates, type BrandEditorialFrontmatter } from "./schemas";
import type { TocItem } from "./types";

/**
 * 品牌页编辑正文：content/brands/<品牌 slug>.mdx
 * 文件名必须等于 data/brands.json 中的 slug，frontmatter.brand 必须等于品牌 id。
 */
export interface BrandEditorial {
  frontmatter: BrandEditorialFrontmatter;
  body: string;
  toc: TocItem[];
  /** 正文汉字数（不含 frontmatter、标记与英文） */
  cjkChars: number;
  file: string;
}

export const BRAND_EDITORIAL_DIR = path.join(process.cwd(), "content", "brands");

export function countCjkChars(markdown: string): number {
  return (stripMarkdown(markdown).match(/[㐀-鿿]/g) ?? []).length;
}

let cache: Map<string, BrandEditorial> | null = null;

function load(): Map<string, BrandEditorial> {
  if (cache && process.env.NODE_ENV === "production") return cache;
  const map = new Map<string, BrandEditorial>();
  if (fs.existsSync(BRAND_EDITORIAL_DIR)) {
    for (const file of fs.readdirSync(BRAND_EDITORIAL_DIR).filter((f) => f.endsWith(".mdx")).sort()) {
      const rel = `content/brands/${file}`;
      const { data, content } = matter(fs.readFileSync(path.join(BRAND_EDITORIAL_DIR, file), "utf8"));
      const parsed = brandEditorialSchema.safeParse(normalizeFrontmatterDates(data));
      if (!parsed.success) {
        throw new Error(`${rel} 的 frontmatter 不合法：${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("；")}`);
      }
      map.set(parsed.data.brand, {
        frontmatter: parsed.data,
        body: content,
        toc: extractToc(content),
        cjkChars: countCjkChars(content),
        file: rel,
      });
    }
  }
  cache = map;
  return map;
}

export function getBrandEditorial(brandId: string): BrandEditorial | undefined {
  return load().get(brandId);
}

export function getAllBrandEditorials(): BrandEditorial[] {
  return [...load().values()];
}

/** 品牌资料页（/brands/<slug>/）建立日期；灵动云专区随网站内容一起建立 */
export const BRAND_PAGES_CREATED_AT = "2026-11-13";
export const HUB_CREATED_AT = "2026-11-12";

/**
 * 品牌页的发布 / 更新日期：优先取编辑正文 frontmatter；没有正文的品牌用页面建立日期，
 * 更新日期取正文、品牌数据（data/brands.json updatedAt）中较晚者。页面显示、JSON-LD 与 sitemap 共用这一结果。
 */
export function brandPageDates(brand: { id: string; hubPath: string | null; updatedAt: string }): { publishedAt: string; updatedAt: string } {
  const ed = getBrandEditorial(brand.id);
  const publishedAt = ed?.frontmatter.publishedAt ?? (brand.hubPath ? HUB_CREATED_AT : BRAND_PAGES_CREATED_AT);
  const updatedAt = maxDate([publishedAt, ed?.frontmatter.updatedAt, brand.updatedAt]) ?? publishedAt;
  return { publishedAt, updatedAt };
}
