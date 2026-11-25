import { z } from "zod";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日期必须为 YYYY-MM-DD 格式（请在 frontmatter 中加引号）");

export const CATEGORY_ENUM = z.enum(["recommend", "reviews", "compare", "speedtest", "guides", "lingdongyun"]);

export const sourceSchema = z.object({
  label: z.string().min(2),
  date: dateString.optional(),
  note: z.string().optional(),
  url: z.string().optional(),
});

export const testInfoSchema = z.object({
  testedAt: z.string().min(10),
  network: z.string().min(2),
  tool: z.string().min(2),
  method: z.string().min(10),
  evidence: z.enum(["owner-measured", "owner-screenshot", "text-record"]),
  limitations: z.array(z.string()).optional(),
});

export const faqItemSchema = z.object({
  q: z.string().min(4),
  a: z.string().min(10),
});

/** 一条实质修改记录（只写改了什么，不写“优化了内容”这类空话） */
export const changeEntrySchema = z.object({
  date: dateString,
  note: z.string().min(4),
});

export const articleFrontmatterSchema = z.object({
  title: z.string().min(6).max(60),
  /** 可选：<title> 用的较短标题（H1 仍用 title）。站点会自动追加“ - 机场优选” */
  seoTitle: z.string().min(6).max(40).optional(),
  /** 可选：实质修改记录，显示在文章信息区并汇总到 /updates/ */
  changes: z.array(changeEntrySchema).optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug 只能包含小写字母、数字与连字符"),
  description: z.string().min(50).max(160),
  category: CATEGORY_ENUM,
  tags: z.array(z.string().min(1)).min(1).max(8),
  author: z.string().min(1).default("editorial"),
  publishedAt: dateString,
  updatedAt: dateString,
  cover: z.string().regex(/^\/images\//, "cover 必须是 /images/ 下的站内路径"),
  coverAlt: z.string().optional(),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
  featuredOrder: z.number().int().positive().optional(),
  related: z.array(z.string()).default([]),
  summaryPoints: z.array(z.string().min(4)).max(6).optional(),
  sources: z.array(sourceSchema).optional(),
  methodology: z.string().optional(),
  disclosure: z.string().optional(),
  plansVerifiedAt: dateString.optional(),
  /** 关联品牌 id（必须存在于 data/brands.json，由校验脚本检查） */
  brand: z.string().regex(/^[a-z0-9-]+$/).optional(),
  regions: z.array(z.string()).optional(),
  test: testInfoSchema.optional(),
  faq: z.array(faqItemSchema).max(10).optional(),
  noindex: z.boolean().optional(),
});

export type ArticleFrontmatterInput = z.input<typeof articleFrontmatterSchema>;

/**
 * 品牌页编辑正文（content/brands/<品牌 slug>.mdx）。
 * 渲染在 /brands/<slug>/（灵动云渲染在 /lingdongyun/），正文在套餐表之前输出。
 * faq 同时渲染为页面可见的“常见问题”与 FAQPage 结构化数据。
 */
export const brandEditorialSchema = z.object({
  brand: z.string().regex(/^[a-z0-9-]+$/),
  /** <title> 主体，站点自动追加“ - 机场优选” */
  seoTitle: z.string().min(10).max(40),
  h1: z.string().min(8).max(40),
  description: z.string().min(70).max(160),
  author: z.string().min(1).default("editorial"),
  publishedAt: dateString,
  updatedAt: dateString,
  summaryPoints: z.array(z.string().min(6)).min(3).max(6),
  faq: z.array(faqItemSchema).min(3).max(8),
  /** 相关文章 slug（优先放该品牌相关的比较文与教程） */
  related: z.array(z.string()).min(2).max(6),
  changes: z.array(changeEntrySchema).optional(),
});

export type BrandEditorialFrontmatter = z.infer<typeof brandEditorialSchema>;

/** data/changelog.json：全站更新记录（/updates/） */
export const changelogSchema = z.array(
  z.object({
    date: dateString,
    title: z.string().min(4),
    items: z.array(z.string().min(4)).min(1),
    paths: z.array(z.string().regex(/^\/.*\/$|^\/$/, "路径必须以 / 开头并以 / 结尾")).optional(),
  }),
);

export type ChangelogEntry = z.infer<typeof changelogSchema>[number];

/** gray-matter 会把未加引号的 YAML 日期解析成 Date，这里统一转回 YYYY-MM-DD */
export function normalizeFrontmatterDates(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  for (const key of ["publishedAt", "updatedAt", "plansVerifiedAt"]) {
    const v = out[key];
    if (v instanceof Date) out[key] = v.toISOString().slice(0, 10);
  }
  return out;
}

/* =========================================================
   品牌与套餐数据（data/brands.json、data/plans.json）
   ========================================================= */

export const CYCLE_KEYS = ["monthly", "quarterly", "half-year", "yearly", "two-year", "three-year"] as const;
export type CycleKey = (typeof CYCLE_KEYS)[number];

const urlString = z.string().url().refine((u) => u.startsWith("https://"), "链接必须以 https:// 开头");

export const brandCouponSchema = z.object({
  code: z.string().min(2),
  /** 资料未写折扣时为 null，页面显示“折扣以结算页为准” */
  discount: z.string().nullable(),
  appliesTo: z.array(z.string()),
  excludes: z.array(z.string()),
  limits: z.string().nullable(),
  usage: z.string(),
  note: z.string().nullable(),
});

export const brandSupportSchema = z.object({
  channels: z.array(z.string()),
  hours: z.string().nullable(),
  refund: z.string().nullable(),
  trial: z.string().nullable(),
  payment: z.string().nullable(),
  antiFraud: z.string().nullable(),
});

export const brandSourceSchema = z.object({
  file: z.string(),
  date: dateString,
  type: z.enum(["owner-supplied", "owner-measured", "promotional-copy", "third-party"]),
  note: z.string().optional(),
});

export const brandSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  nameEn: z.string().nullable(),
  aliases: z.array(z.string()),
  /** 一句话定位（不含排名、不含未证实的年限） */
  tagline: z.string().nullable(),
  /** 中性简介（编辑整理，注明“资料显示”） */
  summary: z.string().min(20),
  audiences: z.array(z.string()),
  hubPath: z.string().nullable(),
  affiliateUrl: urlString.nullable(),
  officialUrl: urlString.nullable(),
  relationship: z.enum(["sponsored", "none"]),
  coupon: brandCouponSchema.nullable(),
  regions: z.array(z.string()),
  nodeCount: z.number().int().positive().nullable(),
  nodeCountNote: z.string().nullable(),
  nodeCountByRegion: z.record(z.string(), z.number().int().positive()).nullable(),
  lineTypes: z.array(z.string()),
  ratio: z.string().nullable(),
  deviceLimit: z.string().nullable(),
  supportedPlatforms: z.array(z.string()).nullable(),
  clientPolicy: z.array(z.string()),
  streaming: z.array(z.string()),
  aiTools: z.array(z.string()),
  otherServices: z.array(z.string()),
  streamingNote: z.string().nullable(),
  trafficRules: z.array(z.string()),
  support: brandSupportSchema.nullable(),
  purchaseSteps: z.array(z.string()),
  /** verified：价格已核对（站长在品牌官网或用户后台核对，verifiedAt 为核对日期；2026-11-25 起全部品牌）；reference：原稿参考价（尚未核对，目前没有品牌）；pending：不展示价格 */
  dataStatus: z.enum(["verified", "reference", "pending"]),
  verifiedAt: dateString.nullable(),
  materialDate: dateString,
  updatedAt: dateString,
  sources: z.array(brandSourceSchema).min(1),
  externalSources: z.array(z.object({ label: z.string(), url: z.string(), retrievedAt: dateString })),
  verificationNotes: z.array(z.object({ field: z.string(), finding: z.string(), status: z.string() })),
  conflicts: z.array(z.string()),
  caveats: z.array(z.string()),
  marketingClaims: z.array(z.string()),
  featuredOrder: z.number().int().positive(),
  published: z.boolean(),
});

export type Brand = z.infer<typeof brandSchema>;

const priceMap = z.object({
  monthly: z.number().positive().optional(),
  quarterly: z.number().positive().optional(),
  "half-year": z.number().positive().optional(),
  yearly: z.number().positive().optional(),
  "two-year": z.number().positive().optional(),
  "three-year": z.number().positive().optional(),
});

export const brandPlansSchema = z.object({
  brandId: z.string(),
  source: z.string(),
  materialDate: dateString,
  /** verified：价格已核对（站长在品牌官网或用户后台核对）；reference：原稿参考价（尚未核对） */
  priceStatus: z.enum(["verified", "reference"]),
  verifiedAt: dateString.nullable(),
  lineType: z.string().nullable(),
  devices: z.string().nullable(),
  cycleDiscounts: z.string().nullable(),
  periodic: z.array(
    z.object({
      plan: z.string(),
      trafficGb: z.number().positive(),
      prices: priceMap,
      notes: z.array(z.string()).optional(),
    }),
  ),
  yearlySmall: z.array(z.object({ plan: z.string(), trafficGb: z.number().positive(), price: z.number().positive(), notes: z.array(z.string()).optional() })),
  dataPacks: z.array(
    z.object({
      plan: z.string(),
      trafficGb: z.number().positive(),
      price: z.number().positive(),
      devices: z.string().optional(),
      notes: z.array(z.string()).optional(),
    }),
  ),
  custom: z.array(
    z.object({
      plan: z.string(),
      trafficGb: z.number().positive().nullable(),
      price: z.number().positive(),
      cycle: z.enum(CYCLE_KEYS),
      notes: z.array(z.string()).optional(),
    }),
  ),
  notes: z.array(z.string()),
});

export type BrandPlans = z.infer<typeof brandPlansSchema>;
