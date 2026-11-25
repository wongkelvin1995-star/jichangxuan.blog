/**
 * 内容与数据校验（构建前自动执行）：
 *  - 文章 frontmatter 符合 schema；slug 与文件名一致、全站唯一；category 与目录一致
 *  - 日期不得为未来（按北京时间）；updatedAt 不早于 publishedAt
 *  - related 指向的 slug 必须存在；cover 文件必须存在；brand 必须存在于 data/brands.json
 *  - 标题、描述在已发布文章间唯一
 *  - 禁止在已发布内容中出现评分、好评率等虚构结构（启发式检查）
 *  - data/brands.json、data/plans.json 符合 schema；id / slug 唯一；套餐的 brandId 必须存在；
 *    已发布品牌的定位与简介不得含横向排名表述；资料文件必须存在
 */
import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import { todayInBeijing } from "../lib/format";
import { HOME_RANKING } from "../lib/ranking";
import {
  articleFrontmatterSchema,
  brandEditorialSchema,
  brandPlansSchema,
  brandSchema,
  changelogSchema,
  normalizeFrontmatterDates,
} from "../lib/schemas";

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content");
const CATEGORIES = ["recommend", "reviews", "compare", "speedtest", "guides", "lingdongyun"];
/** 不需要内容文件就存在的站内路径（静态页与栏目页） */
const STATIC_ROUTES = ["/", "/articles/", "/brands/", "/about/", "/methodology/", "/disclosure/", "/contact/", "/privacy/", "/updates/", "/search/", "/tags/", ...CATEGORIES.map((c) => `/${c}/`)];
/** 构建生成的文件路由（不带结尾斜杠） */
const FILE_ROUTES = ["/rss.xml", "/sitemap.xml", "/robots.txt", "/plans.json", "/search-index.json"];
/** 旧站名（不含“机场选择 / 机场选购”这类普通词） */
const OLD_SITE_NAME = /机场选(?![择购])/;

const FORBIDDEN: { pattern: RegExp; reason: string }[] = [
  { pattern: /ratingValue|aggregateRating/i, reason: "不得输出评分结构化数据" },
  { pattern: /评分[：:]\s*\d/, reason: "不得给品牌打分" },
  { pattern: /\d+(\.\d+)?\s*分\s*\/\s*10/, reason: "不得使用 x/10 评分" },
  { pattern: /好评率|满意度\s*\d/, reason: "不得编造用户好评数据" },
  { pattern: /星级评[价定]/, reason: "不得使用星级评价" },
];
const RANKING_WORDS = /\d+\s*家中|并列第|中位数|排行第|排名第/;

const errors: string[] = [];
const warnings: string[] = [];
const today = todayInBeijing();

/* ---------- 品牌与套餐数据 ---------- */
const brandsRaw = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "brands.json"), "utf8"));
const brandsParsed = brandSchema.array().safeParse(brandsRaw);
const brandIds = new Set<string>();
if (!brandsParsed.success) {
  errors.push(`data/brands.json 不合法：${brandsParsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("；")}`);
} else {
  const slugs = new Set<string>();
  const orders = new Set<number>();
  for (const b of brandsParsed.data) {
    if (brandIds.has(b.id)) errors.push(`brands.json：id 重复 ${b.id}`);
    brandIds.add(b.id);
    if (slugs.has(b.slug)) errors.push(`brands.json：slug 重复 ${b.slug}`);
    slugs.add(b.slug);
    if (orders.has(b.featuredOrder)) warnings.push(`brands.json：featuredOrder ${b.featuredOrder} 重复（${b.name}）`);
    orders.add(b.featuredOrder);
    for (const text of [b.tagline ?? "", b.summary]) {
      if (RANKING_WORDS.test(text)) errors.push(`brands.json：${b.name} 的定位 / 简介含横向排名表述（本站不展示排名）`);
    }
    if (b.materialDate > today) errors.push(`brands.json：${b.name} materialDate 是未来日期`);
    if (b.updatedAt > today) errors.push(`brands.json：${b.name} updatedAt 是未来日期`);
    // 品牌页的“更新于”与 sitemap lastmod 取 updatedAt，它不能早于资料日期或核对日期
    if (b.updatedAt < b.materialDate) errors.push(`brands.json：${b.name} updatedAt（${b.updatedAt}）早于资料日期 ${b.materialDate}`);
    if (b.verifiedAt && b.updatedAt < b.verifiedAt) errors.push(`brands.json：${b.name} updatedAt（${b.updatedAt}）早于核对日期 ${b.verifiedAt}`);
    if (b.verifiedAt && b.verifiedAt > today) errors.push(`brands.json：${b.name} verifiedAt 是未来日期`);
    if (b.dataStatus === "verified" && !b.verifiedAt) errors.push(`brands.json：${b.name} 标为 verified 但没有 verifiedAt`);
    if (b.relationship === "sponsored" && !b.affiliateUrl) warnings.push(`brands.json：${b.name} 为推广合作但没有推广链接`);
    for (const s of b.sources) {
      if (!fs.existsSync(path.join(ROOT, s.file))) errors.push(`brands.json：${b.name} 的资料文件不存在：${s.file}`);
    }
    if (b.published && b.dataStatus !== "pending") {
      // 已发布且展示价格的品牌必须有套餐数据
    }
  }
}

const plansRaw = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "plans.json"), "utf8"));
const plansParsed = brandPlansSchema.array().safeParse(plansRaw);
if (!plansParsed.success) {
  errors.push(`data/plans.json 不合法：${plansParsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("；")}`);
} else {
  const seen = new Set<string>();
  for (const p of plansParsed.data) {
    if (!brandIds.has(p.brandId)) errors.push(`plans.json：brandId ${p.brandId} 不存在于 brands.json`);
    if (seen.has(p.brandId)) errors.push(`plans.json：brandId ${p.brandId} 重复`);
    seen.add(p.brandId);
    if (!fs.existsSync(path.join(ROOT, p.source))) errors.push(`plans.json：${p.brandId} 的资料文件不存在：${p.source}`);
    if (p.priceStatus === "verified" && !p.verifiedAt) errors.push(`plans.json：${p.brandId} 标为 verified 但没有 verifiedAt`);
    if (!p.periodic.length && !p.yearlySmall.length && !p.dataPacks.length && !p.custom.length) warnings.push(`plans.json：${p.brandId} 没有任何套餐`);
    const names = new Set<string>();
    for (const t of [...p.periodic, ...p.yearlySmall, ...p.dataPacks, ...p.custom]) {
      if (names.has(t.plan)) errors.push(`plans.json：${p.brandId} 套餐名重复 ${t.plan}`);
      names.add(t.plan);
    }
  }
  if (brandsParsed.success) {
    for (const b of brandsParsed.data) {
      if (b.published && b.dataStatus !== "pending" && !seen.has(b.id)) errors.push(`brands.json：${b.name} 已发布且展示价格，但 plans.json 没有对应套餐数据`);
    }
  }
}

/* ---------- 文章 ---------- */
type Loaded = { file: string; fm: Record<string, unknown>; body: string };
const loaded: Loaded[] = [];

for (const category of CATEGORIES) {
  const dir = path.join(CONTENT, category);
  if (!fs.existsSync(dir)) {
    warnings.push(`目录不存在：content/${category}`);
    continue;
  }
  for (const file of fs.readdirSync(dir).filter((f) => /\.mdx?$/.test(f))) {
    const rel = `content/${category}/${file}`;
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const { data, content } = matter(raw);
    const parsed = articleFrontmatterSchema.safeParse(normalizeFrontmatterDates(data));
    if (!parsed.success) {
      errors.push(`${rel}：frontmatter 不合法 → ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("；")}`);
      continue;
    }
    const fm = parsed.data as Record<string, unknown> & {
      slug: string;
      category: string;
      publishedAt: string;
      updatedAt: string;
      cover: string;
      related: string[];
      draft: boolean;
      title: string;
      description: string;
      brand?: string;
      test?: { testedAt: string };
      regions?: string[];
      sources?: unknown[];
      plansVerifiedAt?: string;
    };
    if (fm.slug !== file.replace(/\.mdx?$/, "")) errors.push(`${rel}：slug（${fm.slug}）必须与文件名一致`);
    if (fm.category !== category) errors.push(`${rel}：category（${fm.category}）必须与目录名一致`);
    if (fm.publishedAt > today) errors.push(`${rel}：publishedAt（${fm.publishedAt}）是未来日期`);
    if (fm.updatedAt > today) errors.push(`${rel}：updatedAt（${fm.updatedAt}）是未来日期`);
    if (fm.updatedAt < fm.publishedAt) errors.push(`${rel}：updatedAt 早于 publishedAt`);
    if (fm.plansVerifiedAt && fm.plansVerifiedAt > today) errors.push(`${rel}：plansVerifiedAt 是未来日期`);
    if (!fs.existsSync(path.join(ROOT, "public", fm.cover))) errors.push(`${rel}：cover 文件不存在：public${fm.cover}`);
    if (fm.brand && !brandIds.has(fm.brand)) errors.push(`${rel}：brand（${fm.brand}）不存在于 data/brands.json`);
    if (fm.test) {
      if (fm.test.testedAt.slice(0, 10) > today) errors.push(`${rel}：test.testedAt 是未来日期`);
      if (!fm.regions?.length) errors.push(`${rel}：测速类文章必须填写 regions`);
      if (!fm.sources?.length) errors.push(`${rel}：测速类文章必须填写 sources`);
    }
    if (!fm.draft) {
      for (const f of FORBIDDEN) {
        if (f.pattern.test(content) || f.pattern.test(JSON.stringify(data))) errors.push(`${rel}：${f.reason}（匹配 ${f.pattern}）`);
      }
      const chars = content.replace(/\s+/g, "").length;
      if (chars < 800) errors.push(`${rel}：已发布文章正文过短（${chars} 字），不足 800 字`);
    }
    loaded.push({ file: rel, fm, body: content });
  }
}

const slugs = new Map<string, string>();
const titles = new Map<string, string>();
const descriptions = new Map<string, string>();
for (const { file, fm } of loaded) {
  const slug = fm.slug as string;
  if (slugs.has(slug)) errors.push(`${file}：slug 与 ${slugs.get(slug)} 重复`);
  slugs.set(slug, file);
  if (!fm.draft) {
    const title = fm.title as string;
    const desc = fm.description as string;
    if (titles.has(title)) errors.push(`${file}：标题与 ${titles.get(title)} 重复`);
    titles.set(title, file);
    if (descriptions.has(desc)) errors.push(`${file}：描述与 ${descriptions.get(desc)} 重复`);
    descriptions.set(desc, file);
  }
}
for (const { file, fm } of loaded) {
  for (const r of fm.related as string[]) {
    if (!slugs.has(r)) errors.push(`${file}：related 指向不存在的 slug：${r}`);
    else if (!fm.draft) {
      const target = loaded.find((l) => l.fm.slug === r);
      if (target?.fm.draft) warnings.push(`${file}：related 指向草稿 ${r}，发布页面上不会显示`);
    }
  }
}

for (const { file, fm, body } of loaded) {
  if (fm.draft) continue;
  if (OLD_SITE_NAME.test(body) || OLD_SITE_NAME.test(JSON.stringify(fm))) errors.push(`${file}：仍含旧站名“机场选”，应为“机场优选”`);
  for (const c of (fm.changes as { date: string }[] | undefined) ?? []) {
    if (c.date > today) errors.push(`${file}：changes 中有未来日期 ${c.date}`);
  }
}

/* ---------- 品牌页编辑正文（content/brands/*.mdx） ---------- */
type BrandLite = { id: string; slug: string; name: string; published: boolean; hubPath: string | null; relationship: string; featuredOrder: number; affiliateUrl: string | null };
const brandList: BrandLite[] = brandsParsed.success ? brandsParsed.data : [];
const brandBySlug = new Map(brandList.map((b) => [b.slug, b]));
const editorials: Loaded[] = [];
const editorialDir = path.join(CONTENT, "brands");
const cjkCount = (s: string) =>
  (
    s
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .match(/[㐀-鿿]/g) ?? []
  ).length;
/** 显示宽度：全角 / 汉字记 2，其余记 1 */
const displayWidth = (s: string) => [...s].reduce((n, ch) => n + (/[⺀-鿿＀-￯　-〿]/.test(ch) ? 2 : 1), 0);
const TITLE_SUFFIX = " - 机场优选";

if (fs.existsSync(editorialDir)) {
  for (const file of fs.readdirSync(editorialDir).filter((f) => f.endsWith(".mdx"))) {
    const rel = `content/brands/${file}`;
    const { data, content } = matter(fs.readFileSync(path.join(editorialDir, file), "utf8"));
    const parsed = brandEditorialSchema.safeParse(normalizeFrontmatterDates(data));
    if (!parsed.success) {
      errors.push(`${rel}：frontmatter 不合法 → ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("；")}`);
      continue;
    }
    const fm = parsed.data;
    const slug = file.replace(/\.mdx$/, "");
    const brand = brandBySlug.get(slug);
    if (!brand) errors.push(`${rel}：文件名必须等于 data/brands.json 中某个品牌的 slug`);
    else {
      if (brand.id !== fm.brand) errors.push(`${rel}：brand（${fm.brand}）必须等于该 slug 对应的品牌 id（${brand.id}）`);
      if (!brand.published) errors.push(`${rel}：品牌 ${brand.name} 未发布`);
    }
    if (fm.publishedAt > today) errors.push(`${rel}：publishedAt 是未来日期`);
    if (fm.updatedAt > today) errors.push(`${rel}：updatedAt 是未来日期`);
    if (fm.updatedAt < fm.publishedAt) errors.push(`${rel}：updatedAt 早于 publishedAt`);
    for (const c of fm.changes ?? []) if (c.date > today) errors.push(`${rel}：changes 中有未来日期 ${c.date}`);
    if (/^#\s/m.test(content)) errors.push(`${rel}：正文不能使用一级标题（H1 由页面根据 frontmatter.h1 输出）`);
    for (const f of FORBIDDEN) {
      if (f.pattern.test(content) || f.pattern.test(JSON.stringify(data))) errors.push(`${rel}：${f.reason}（匹配 ${f.pattern}）`);
    }
    if (OLD_SITE_NAME.test(content) || OLD_SITE_NAME.test(JSON.stringify(data))) errors.push(`${rel}：含旧站名“机场选”`);
    const chars = cjkCount(content);
    if (chars < 1200) errors.push(`${rel}：品牌正文汉字 ${chars} 个，不足 1200`);
    else if (chars > 2600) warnings.push(`${rel}：品牌正文汉字 ${chars} 个，超过 2600，建议精简`);
    const qs = new Set<string>();
    for (const item of fm.faq) {
      if (qs.has(item.q)) errors.push(`${rel}：FAQ 问题重复：${item.q}`);
      qs.add(item.q);
    }
    if (displayWidth(fm.seoTitle + TITLE_SUFFIX) > 66) warnings.push(`${rel}：seoTitle 加站名后显示宽度 ${displayWidth(fm.seoTitle + TITLE_SUFFIX)}，超过 66（约 33 个汉字），搜索结果可能截断`);
    for (const r of fm.related) {
      const target = loaded.find((l) => l.fm.slug === r);
      if (!target) errors.push(`${rel}：related 指向不存在的 slug：${r}`);
      else if (target.fm.draft) warnings.push(`${rel}：related 指向草稿 ${r}，发布页面上不会显示`);
    }
    editorials.push({ file: rel, fm: fm as unknown as Record<string, unknown>, body: content });
  }
}

/* ---------- 标题唯一性（含 seoTitle 与品牌正文） ---------- */
{
  // 不同文件之间的 <title> 与 H1 不能相同；同一文件的 seoTitle 与自己的 H1 相同不算冲突
  const seen = new Map<string, string>();
  const add = (t: string | undefined, file: string) => {
    if (!t) return;
    const prev = seen.get(t);
    if (prev && prev !== file) errors.push(`${file}：标题“${t}”与 ${prev} 重复`);
    else if (!prev) seen.set(t, file);
  };
  for (const { file, fm } of loaded) {
    if (fm.draft) continue;
    const shown = (fm.seoTitle as string | undefined) ?? (fm.title as string);
    add(shown, file);
    if (fm.seoTitle) add(fm.title as string, file);
    if (displayWidth(shown + TITLE_SUFFIX) > 66) warnings.push(`${file}：<title> 显示宽度 ${displayWidth(shown + TITLE_SUFFIX)}，超过 66，建议补充更短的 seoTitle`);
  }
  for (const { file, fm } of editorials) {
    add(fm.seoTitle as string, file);
    add(fm.h1 as string, file);
  }
}

/* ---------- 正文内链：必须指向真实存在、带结尾斜杠的站内地址 ---------- */
{
  const articleRoutes = new Map<string, boolean>(); // path -> draft?
  for (const { fm } of loaded) articleRoutes.set(`/${fm.category}/${fm.slug}/`, !!fm.draft);
  const brandRoutes = new Set(brandList.filter((b) => b.published).map((b) => b.hubPath ?? `/brands/${b.slug}/`));
  const affiliateHosts = new Set(
    brandList
      .map((b) => b.affiliateUrl)
      .filter((u): u is string => !!u)
      .map((u) => new URL(u).host),
  );
  // Markdown 链接（不含图片 ![...](...)，标题可用单引号或双引号）与 JSX/HTML 的 href
  const linkRe = /(?<!!)\[[^\]]*\]\(\s*([^)\s]+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)|href=["']([^"']+)["']/g;
  const siteHosts = new Set(["jichangxuan.blog", "www.jichangxuan.blog"]);
  for (const { file, fm, body: rawBody } of [...loaded, ...editorials]) {
    if (fm.draft) continue;
    // 代码块与行内代码里的示例不算链接
    const body = rawBody.replace(/```[\s\S]*?```/g, " ").replace(/`[^`\n]*`/g, " ");
    let internal = 0;
    for (const m of body.matchAll(linkRe)) {
      const href = (m[1] ?? m[2] ?? "").trim();
      if (/^https?:\/\//i.test(href)) {
        let host = "";
        try {
          host = new URL(href).host;
        } catch {
          errors.push(`${file}：外链格式错误 ${href}`);
          continue;
        }
        if (affiliateHosts.has(host)) errors.push(`${file}：正文不能直接写推广链接（${host}），请使用页面自带的购买按钮`);
        if (siteHosts.has(host)) errors.push(`${file}：本站链接请写成站内路径（以 / 开头），不要写完整域名：${href}`);
        continue;
      }
      if (href.startsWith("#") || href.startsWith("mailto:")) continue;
      if (!href.startsWith("/")) {
        errors.push(`${file}：内链必须是以 / 开头的站内绝对路径：${href}`);
        continue;
      }
      const clean = href.replace(/[?#].*$/, "");
      if (href.includes("?")) errors.push(`${file}：内链不要带查询参数（会产生重复 URL）：${href}`);
      // 文件链接：只要求文件真实存在（public/ 下的文件或构建生成的文件路由）
      if (/\.[a-z0-9]+$/i.test(clean)) {
        if (!FILE_ROUTES.includes(clean) && !fs.existsSync(path.join(ROOT, "public", clean))) errors.push(`${file}：链接的文件不存在：${href}`);
        continue;
      }
      if (!clean.endsWith("/")) {
        errors.push(`${file}：内链缺少结尾斜杠（会多一次跳转）：${href}`);
        continue;
      }
      internal++;
      if (STATIC_ROUTES.includes(clean) || brandRoutes.has(clean)) continue;
      if (/^\/tags\/[^/]+\/$/.test(clean) || /^\/(articles|recommend|reviews|compare|speedtest|guides|lingdongyun)\/page\/\d+\/$/.test(clean)) continue;
      if (articleRoutes.has(clean)) {
        if (articleRoutes.get(clean)) warnings.push(`${file}：链接到草稿 ${clean}（发布前该地址是 404）`);
        continue;
      }
      errors.push(`${file}：内链指向不存在的页面：${href}`);
    }
    if (file.startsWith("content/brands/") && internal < 3) errors.push(`${file}：品牌正文至少需要 3 条站内链接（目前 ${internal} 条）`);
  }
}

/* ---------- 首页推荐榜固定顺序 ---------- */
{
  // 2026-11-25 站长把首页推荐榜调整为 12 家；家数变动时同步修改这里与 scripts/site-check.mjs 的 HOME_EXPECT
  if (HOME_RANKING.length !== 12) errors.push(`lib/ranking.ts：首页推荐榜应为 12 家（目前 ${HOME_RANKING.length}）`);
  HOME_RANKING.forEach((r, i) => {
    if (r.rank !== i + 1) errors.push(`lib/ranking.ts：第 ${i + 1} 项的 rank 是 ${r.rank}，顺序不能改动`);
    const b = brandList.find((x) => x.id === r.brandId);
    if (!b) {
      errors.push(`lib/ranking.ts：品牌 ${r.brandId} 不存在于 data/brands.json`);
      return;
    }
    if (!b.published) errors.push(`lib/ranking.ts：品牌 ${b.name} 未发布，不能上榜`);
    if (b.featuredOrder !== r.rank) errors.push(`data/brands.json：${b.name} 的 featuredOrder 应为 ${r.rank}（与首页推荐榜一致），目前是 ${b.featuredOrder}`);
    if (b.relationship !== "sponsored") errors.push(`lib/ranking.ts：${b.name} 不是推广合作品牌，与榜单披露“上榜品牌均为推广合作”不符，请同步修改披露文案`);
  });
}

/* ---------- 更新记录 data/changelog.json ---------- */
{
  const file = path.join(ROOT, "data", "changelog.json");
  if (fs.existsSync(file)) {
    const parsed = changelogSchema.safeParse(JSON.parse(fs.readFileSync(file, "utf8")));
    if (!parsed.success) errors.push(`data/changelog.json 不合法：${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("；")}`);
    else {
      parsed.data.forEach((e, i) => {
        if (e.date > today) errors.push(`data/changelog.json：第 ${i + 1} 条是未来日期 ${e.date}`);
        if (i > 0 && e.date > parsed.data[i - 1].date) warnings.push(`data/changelog.json：第 ${i + 1} 条没有按日期倒序排列`);
      });
    }
  } else warnings.push("data/changelog.json 不存在（/updates/ 页面会是空的）");
}

const published = loaded.filter((l) => !l.fm.draft).length;
const drafts = loaded.length - published;
for (const w of warnings) console.warn(`⚠ ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`);
  console.error(`\n校验失败：${errors.length} 个错误。`);
  process.exit(1);
}
const brandCount = brandsParsed.success ? brandsParsed.data.length : 0;
const publishedBrands = brandsParsed.success ? brandsParsed.data.filter((b) => b.published).length : 0;
console.log(
  `✓ 校验通过：文章 ${loaded.length} 篇（已发布 ${published}，草稿 ${drafts}）；品牌正文 ${editorials.length} 篇；品牌 ${brandCount} 个（已发布 ${publishedBrands}）；首页推荐榜 ${HOME_RANKING.length} 家顺序一致；今天（北京时间）${today}`,
);
