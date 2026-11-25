import { getArticlesByCategory, toSummary } from "./content";
import type { ArticleSummary } from "./types";

/**
 * 测评专区（/reviews/）的展示顺序，站长 2026-11-25 指定，不按日期或其他条件自动排序。
 * 与首页推荐榜顺序不同（隐形人、FLYV、浪网的位置不一样），两处分开维护。
 */
export const REVIEW_ORDER = [
  "lingdongyun",
  "muguang-jiasu",
  "weifeng-wangluo",
  "feimaoyun",
  "dalaoyun",
  "yinxingren",
  "flyv",
  "langwang",
  "tiziyun",
  "wuyou",
  "firefly",
  "quanqiuyun",
] as const;

/** 测评专区的筛选项：按文章 frontmatter 的真实标签筛选 */
export const REVIEW_FILTERS = ["套餐分析", "节点线路", "AI应用", "流媒体", "性价比"] as const;

export type ReviewCard = ArticleSummary & { brand?: string; filters: string[] };

/** 已发布测评文章：先按 REVIEW_ORDER，其余（若有）按发布日期倒序排在后面 */
export function getOrderedReviews(): ReviewCard[] {
  const all = getArticlesByCategory("reviews");
  const rank = (brand?: string) => {
    const i = REVIEW_ORDER.indexOf((brand ?? "") as (typeof REVIEW_ORDER)[number]);
    return i === -1 ? REVIEW_ORDER.length : i;
  };
  return [...all]
    .sort((a, b) => rank(a.frontmatter.brand) - rank(b.frontmatter.brand))
    .map((a) => ({
      ...toSummary(a),
      brand: a.frontmatter.brand,
      filters: REVIEW_FILTERS.filter((f) => a.frontmatter.tags.includes(f)),
    }));
}

/** 某品牌的测评文章路径（没有就返回 undefined） */
export function reviewPathForBrand(brandId: string): string | undefined {
  return getOrderedReviews().find((r) => r.brand === brandId)?.path;
}
