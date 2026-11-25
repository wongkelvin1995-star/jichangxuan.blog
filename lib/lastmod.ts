import { brandPageDates } from "./brand-editorials";
import { getPublishedBrands } from "./brands";
import { CHANGELOG } from "./changelog";
import { getCategoryLastModified, getPublishedArticles } from "./content";
import { maxDate } from "./format";
import { ALL_BRAND_PLANS } from "./plans";
import { RANKING_UPDATED_AT } from "./ranking";
import { CATEGORIES, SITE, STATIC_PAGES } from "./site";

/**
 * 每个页面的“最后实质修改日期”，sitemap lastmod、站内搜索的日期与 IndexNow 增量提交共用这一套规则：
 *  - 文章：frontmatter.updatedAt
 *  - 品牌页：编辑正文与品牌数据中较晚者（brandPageDates）
 *  - 首页：文章、品牌页、套餐数据、静态登记、更新记录与推荐榜调整日期中最晚者
 *  - /brands/、/disclosure/：品牌页与推荐榜；/methodology/：页面登记与推荐榜（排序原则写在该页）
 *  - /updates/：全站更新记录与文章修改记录中最晚者
 *  - 栏目页：栏目文章、栏目文案日期，以及栏目实际渲染的数据（套餐、品牌）
 */
const launched = SITE.launchedAt;

function staticLast(path: string): string | undefined {
  return STATIC_PAGES.find((p) => p.path === path)?.lastmod;
}

export function articlesLastModified(): string {
  return maxDate(getPublishedArticles().map((a) => a.frontmatter.updatedAt)) ?? launched;
}

export function brandPagesLastModified(): string {
  return maxDate(getPublishedBrands().map((b) => brandPageDates(b).updatedAt)) ?? launched;
}

export function plansLastModified(): string {
  const brands = getPublishedBrands();
  return (
    maxDate(
      ALL_BRAND_PLANS.flatMap((p) => {
        const b = brands.find((x) => x.id === p.brandId);
        return [b?.updatedAt, p.verifiedAt, p.materialDate];
      }),
    ) ?? launched
  );
}

export function updatesLastModified(): string {
  return (
    maxDate([
      ...CHANGELOG.map((c) => c.date),
      ...getPublishedArticles().flatMap((a) => (a.frontmatter.changes ?? []).map((c) => c.date)),
      staticLast("/updates/"),
    ]) ?? launched
  );
}

export function categoryLastModified(categoryId: string): string {
  const c = CATEGORIES.find((x) => x.id === categoryId);
  const base = maxDate([getCategoryLastModified(c?.id ?? (categoryId as never)), c?.copyUpdatedAt]);
  if (categoryId === "compare") return maxDate([base, plansLastModified()]) ?? launched;
  if (categoryId === "recommend") return maxDate([base, brandPagesLastModified()]) ?? launched;
  if (categoryId === "lingdongyun") {
    const ldy = getPublishedBrands().find((b) => b.id === "lingdongyun");
    return maxDate([base, ldy ? brandPageDates(ldy).updatedAt : undefined]) ?? launched;
  }
  return base ?? launched;
}

export function pageLastModified(path: string): string {
  switch (path) {
    case "/":
      return (
        maxDate([articlesLastModified(), brandPagesLastModified(), plansLastModified(), staticLast("/"), updatesLastModified(), RANKING_UPDATED_AT]) ??
        launched
      );
    case "/articles/":
      return articlesLastModified();
    case "/brands/":
    case "/disclosure/":
      return maxDate([brandPagesLastModified(), staticLast(path), RANKING_UPDATED_AT]) ?? launched;
    case "/methodology/":
      return maxDate([staticLast(path), RANKING_UPDATED_AT]) ?? launched;
    case "/updates/":
      return updatesLastModified();
  }
  const category = CATEGORIES.find((c) => c.path === path);
  if (category) return categoryLastModified(category.id);
  const brand = getPublishedBrands().find((b) => (b.hubPath ?? `/brands/${b.slug}/`) === path);
  if (brand) return brandPageDates(brand).updatedAt;
  const article = getPublishedArticles().find((a) => a.path === path);
  if (article) return article.frontmatter.updatedAt;
  return staticLast(path) ?? launched;
}
