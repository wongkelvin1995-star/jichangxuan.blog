import type { Metadata } from "next";
import { ArrowRight, CalendarDays, RefreshCw, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleBody } from "@/components/article/ArticleBody";
import { ArticleCard } from "@/components/article/ArticleCard";
import { BrandCTA } from "@/components/brand/BrandCTA";
import { BrandProfile } from "@/components/brand/BrandProfile";
import { BrandSources } from "@/components/brand/BrandSources";
import { BrandVerification } from "@/components/brand/BrandVerification";
import { PlanTable } from "@/components/brand/PlanTable";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { StatusBadge } from "@/components/ui/Badge";
import { Faq } from "@/components/ui/Faq";
import { brandPageDates, getBrandEditorial } from "@/lib/brand-editorials";
import {
  brandDisclosureText,
  brandEntryWord,
  brandRegisterLabel,
  dataStatusLabel,
  getBrandBySlug,
  getPublishedBrands,
  listedRegions,
  type Brand,
} from "@/lib/brands";
import { getArticleBySlug, getPublishedArticles, toSummary } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { getEntryPlan, getPlanRowsByBrand } from "@/lib/plans";
import { rankOf } from "@/lib/ranking";
import { reviewPathForBrand } from "@/lib/reviews";
import { brandPageJsonLd, breadcrumbJsonLd, buildMetadata, faqJsonLd } from "@/lib/seo";
import { getAuthor } from "@/lib/site";
import type { ArticleSummary } from "@/lib/types";

type Params = { slug: string };

export const dynamicParams = false;

/** 有专题页的品牌（灵动云）不生成资料页，直接使用专题 */
export function generateStaticParams(): Params[] {
  return getPublishedBrands()
    .filter((b) => !b.hubPath)
    .map((b) => ({ slug: b.slug }));
}

/** 没有编辑正文的品牌：相关阅读的通用候选（按客户端政策挑教程） */
const GENERIC_RELATED = ["budget-airport-plans-2026", "how-to-choose-an-airport-2026", "how-to-read-airport-plans", "node-regions-explained"];

function displayName(brand: Brand): string {
  return brand.nameEn && brand.nameEn !== brand.name ? `${brand.name} ${brand.nameEn}` : brand.name;
}

/** 显示宽度：全角 / 汉字记 2，其余记 1（与 validate-content 一致） */
function displayWidth(s: string): number {
  return [...s].reduce((n, ch) => n + (/[⺀-鿿＀-￯　-〿]/.test(ch) ? 2 : 1), 0);
}

/** 线路写法的简称：去掉括号说明与“周期套餐为”前缀，太长时只保留第一段 */
function lineShort(brand: Brand): string | null {
  const raw = brand.lineTypes[0];
  if (!raw) return null;
  let s = raw.replace(/（.*?）/g, "").replace(/^周期套餐为/, "").trim();
  if (displayWidth(s) > 16) s = s.split(/\s*\+\s*/)[0];
  return s;
}

function trafficRange(brand: Brand): { min: number; max: number } | null {
  const periodic = getPlanRowsByBrand(brand.id).filter((r) => r.kind === "periodic" && r.trafficGb !== null);
  if (!periodic.length) return null;
  const values = periodic.map((r) => r.trafficGb as number);
  return { min: Math.min(...values), max: Math.max(...values) };
}

/**
 * 没有编辑正文的品牌页：Title 用该品牌自己的线路、地区数与流量范围区分，不含价格
 * （价格会变动，只在描述与正文里带核对状态出现）。
 */
/** 地区数只数具体地区；资料另写了“东南亚”“欧美”等统称时写“N 个以上” */
function regionCountText(brand: Brand): string {
  const { concrete, groups } = listedRegions(brand);
  return `${concrete.length} 个${groups.length ? "以上" : ""}节点地区`;
}

function fallbackTitle(brand: Brand): string {
  const range = trafficRange(brand);
  const rangeText = range ? (range.min === range.max ? `每月 ${range.min} GB 套餐` : `每月 ${range.min}–${range.max} GB 套餐`) : "套餐资料";
  const line = lineShort(brand);
  const regionText = regionCountText(brand);
  const candidates = [
    line ? `${brand.name}机场资料：${line}、${regionText}、${rangeText}` : null,
    `${brand.name}机场资料：${regionText}、${rangeText}`,
    `${brand.name}机场资料：节点地区与${rangeText}`,
  ].filter((t): t is string => !!t);
  return candidates.find((t) => displayWidth(`${t} - 机场优选`) <= 66) ?? candidates[candidates.length - 1];
}

function fallbackDescription(brand: Brand): string {
  const entry = getEntryPlan(brand.id);
  const range = trafficRange(brand);
  const status = brand.dataStatus === "verified" ? "已核对" : `原稿参考价，资料日期 ${brand.materialDate}`;
  const name = brand.nameEn && brand.nameEn !== brand.name ? `${brand.name}（${brand.nameEn}）` : brand.name;
  const { concrete, groups } = listedRegions(brand);
  const regions =
    (concrete.length > 4 ? `${concrete.slice(0, 4).join("、")}等 ${concrete.length} 个地区` : concrete.join("、")) +
    (groups.length ? `，另写${groups.join("、")}` : "");
  const client = brand.clientPolicy.some((c) => /不提供订阅链接|暂不支持订阅/.test(c))
    ? "资料称不提供订阅链接"
    : brand.clientPolicy.some((c) => /不推荐使用订阅链接|不推荐导入/.test(c))
      ? "资料称不推荐使用订阅链接"
      : null;
  const parts = [
    `${name}资料整理：${lineShort(brand) ?? "线路资料待核实"}，节点覆盖${regions || "待核实"}`,
    range ? `周期套餐每月 ${range.min}–${range.max} GB` : null,
    entry ? `最低档 ${entry.plan} ¥${entry.price} / ${entry.cycleLabel}（${status}）` : "套餐待核实",
    client,
  ].filter((p): p is string => !!p);
  let text = `${parts.join("；")}。`;
  // 控制在 160 字以内：依次去掉客户端说明与流量范围
  while (text.length > 160 && parts.length > 2) {
    parts.splice(parts.length - (client && parts.includes(client) ? 1 : 2), 1);
    text = `${parts.join("；")}。`;
  }
  return text;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const brand = getBrandBySlug((await params).slug);
  if (!brand || brand.hubPath) return { title: "页面不存在", robots: { index: false, follow: false } };
  const ed = getBrandEditorial(brand.id);
  const dates = brandPageDates(brand);
  return buildMetadata({
    title: ed?.frontmatter.seoTitle ?? fallbackTitle(brand),
    description: ed?.frontmatter.description ?? fallbackDescription(brand),
    path: `/brands/${brand.slug}/`,
    type: "article",
    publishedTime: dates.publishedAt,
    modifiedTime: dates.updatedAt,
    image: "/images/og/recommend.png",
  });
}

function relatedFor(brand: Brand, slugs: string[] | undefined): ArticleSummary[] {
  const brandArticles = getPublishedArticles().filter((a) => a.frontmatter.brand === brand.id);
  const picked = (slugs?.length ? slugs : GENERIC_RELATED)
    .map((s) => getArticleBySlug(s))
    .filter((a): a is NonNullable<typeof a> => !!a && !a.frontmatter.draft);
  const seen = new Set<string>();
  // 该品牌的测评文章排在相关阅读第一位
  const review = brandArticles.filter((a) => a.frontmatter.category === "reviews");
  return [...review, ...picked, ...brandArticles]
    .filter((a) => (seen.has(a.path) ? false : (seen.add(a.path), true)))
    .slice(0, 4)
    .map(toSummary);
}

export default async function BrandPage({ params }: { params: Promise<Params> }) {
  const brand = getBrandBySlug((await params).slug);
  if (!brand || brand.hubPath) notFound();
  const ed = getBrandEditorial(brand.id);
  const fm = ed?.frontmatter;
  const status = dataStatusLabel(brand);
  const entry = getEntryPlan(brand.id);
  const rowCount = getPlanRowsByBrand(brand.id).length;
  const path = `/brands/${brand.slug}/`;
  const { publishedAt, updatedAt } = brandPageDates(brand);
  const author = getAuthor(fm?.author ?? "editorial");
  const h1 = fm?.h1 ?? `${displayName(brand)} 机场资料`;
  const description = fm?.description ?? fallbackDescription(brand);
  const rank = rankOf(brand.id);
  const crumbs = [
    { name: "品牌资料库", path: "/brands/" },
    { name: brand.name, path },
  ];
  const related = relatedFor(brand, fm?.related);
  const hasVerification = brand.verificationNotes.length > 0 || brand.conflicts.length > 0;
  const toc = [
    ...(ed?.toc.filter((t) => t.depth === 2).map((t) => ({ id: t.id, label: t.text })) ?? []),
    { id: "plans", label: "套餐与价格" },
    { id: "profile", label: "资料档案" },
    ...(hasVerification ? [{ id: "verification", label: "资料核验" }] : []),
    { id: "purchase", label: "购买流程" },
    ...(fm?.faq.length ? [{ id: "faq", label: "常见问题" }] : []),
    { id: "sources", label: "来源与更新" },
    ...(related.length ? [{ id: "related", label: "相关阅读" }] : []),
  ];

  return (
    <>
      <JsonLd
        data={[
          brandPageJsonLd({ path, headline: h1, description, datePublished: publishedAt, dateModified: updatedAt, author: fm?.author ?? "editorial", brandId: brand.id }),
          breadcrumbJsonLd(crumbs),
          faqJsonLd(fm?.faq),
        ]}
      />
      <header className="surface-gradient border-b border-line-soft">
        <div className="container-x py-10 md:py-14">
          <Breadcrumbs items={crumbs} />
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {rank && (
              <Link href="/#ranking" className="chip hover:bg-sky">
                首页推荐榜第 {rank} 名（编辑推荐，含推广合作因素）
              </Link>
            )}
            <StatusBadge kind={status.kind} />
            {brand.relationship === "sponsored" && <StatusBadge kind="sponsored" />}
            <span className="chip chip-outline">资料日期 {formatDate(brand.materialDate)}</span>
          </div>
          <h1 className="mt-4 max-w-4xl text-3xl font-bold leading-tight tracking-tight text-ink md:text-4xl">{h1}</h1>
          {brand.aliases.length > 0 && <p className="mt-2 text-sm text-muted">别名：{brand.aliases.join("、")}</p>}
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink-soft">{fm ? fm.description : brand.summary}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <UserRound size={15} aria-hidden="true" />
              <Link href={author.url} rel="author" className="font-medium text-ink-soft hover:text-brand-strong">
                {author.name}
              </Link>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={15} aria-hidden="true" />
              发布于 <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
            </span>
            {updatedAt !== publishedAt && (
              <span className="inline-flex items-center gap-1.5">
                <RefreshCw size={15} aria-hidden="true" />
                更新于 <time dateTime={updatedAt}>{formatDate(updatedAt)}</time>
              </span>
            )}
          </div>
          {fm?.summaryPoints?.length ? (
            <ul className="mt-6 max-w-3xl space-y-1.5 rounded-2xl border border-brand/20 bg-white/80 p-5 text-[0.95rem] text-ink">
              {fm.summaryPoints.map((p) => (
                <li key={p} className="flex gap-2">
                  <span aria-hidden="true" className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href="#plans" className="btn btn-primary">
              {brand.name}套餐{brand.coupon ? "与优惠码" : ""}
              <ArrowRight size={16} aria-hidden="true" className="btn-arrow" />
            </a>
            {brand.relationship === "sponsored" && <BrandCTA brand={brand} label={`前往${brandRegisterLabel(brand)}`} variant="secondary" />}
            {reviewPathForBrand(brand.id) && (
              <Link href={reviewPathForBrand(brand.id)!} className="link-arrow text-sm">
                阅读{brand.name}测评
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            )}
            {entry && (
              <span className="text-sm text-ink-soft">
                最低档 {entry.plan} ¥{entry.price} / {entry.cycleLabel}（{entry.trafficLabel}，{entry.status === "verified" ? "价格已核对" : "原稿参考价"}）
              </span>
            )}
          </div>
          <p className="mt-5 max-w-3xl text-xs leading-relaxed text-muted">
            {brandDisclosureText(brand)}{" "}
            <Link href="/disclosure/" className="font-semibold text-brand-strong underline underline-offset-2">
              商业关系披露
            </Link>
          </p>
        </div>
        <nav aria-label="页面目录" className="border-t border-line-soft bg-white/70">
          <ul className="container-x flex gap-1 overflow-x-auto py-2 text-sm">
            {toc.map((s) => (
              <li key={s.id} className="shrink-0">
                <a href={`#${s.id}`} className="inline-flex min-h-9 items-center rounded-full px-3 font-medium text-ink-soft hover:bg-sky-soft hover:text-brand-strong">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div className="container-x space-y-14 py-10 md:py-14">
        {ed ? (
          <article className="mx-auto max-w-[760px]" aria-label={`${brand.name}编辑正文`}>
            <ArticleBody source={ed.body} />
          </article>
        ) : (
          <section id="status" className="scroll-mt-24 rounded-2xl border border-brand/20 bg-sky-soft/70 p-5 md:p-6" aria-labelledby="status-title">
            <h2 id="status-title" className="flex items-center gap-2 text-lg font-bold text-ink">
              <Sparkles size={18} aria-hidden="true" className="text-brand" />
              {brand.name}资料状态：{status.label}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{status.description}。</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-soft">
              <li>资料没写的字段显示“待核实”；与公开资料冲突的字段只列在“资料核验”中，不作为事实。</li>
              <li>本站没有{brand.name}的测速记录，“流媒体与 AI”等为品牌声称，未经本站测试。</li>
              {brand.caveats.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </section>
        )}

        <section id="plans" className="scroll-mt-24" aria-labelledby="plans-title">
          <span className="section-kicker">Plans</span>
          <h2 id="plans-title" className="section-title">
            {brand.name}套餐与价格
          </h2>
          <p className="section-desc">
            共 {rowCount} 条套餐（含各周期）。
            {brand.coupon && (
              <>
                优惠码 <code className="rounded bg-sky-soft px-1.5 py-0.5 font-mono font-bold text-brand-deep">{brand.coupon.code}</code>
                {brand.coupon.discount ? `（资料称 ${brand.coupon.discount}）` : "（折扣资料未写，以结算页为准）"}
                {brand.coupon.appliesTo.length > 0 && `，适用于 ${brand.coupon.appliesTo.join("、")}`}
                {brand.coupon.excludes.length > 0 && `；不适用于 ${brand.coupon.excludes.join("、")}`}
                {brand.coupon.limits && `；${brand.coupon.limits}`}。{brand.coupon.usage}。{brand.coupon.note ? `${brand.coupon.note}。` : ""}
              </>
            )}
          </p>
          <PlanTable brand={brand.id} />
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/compare/" className="link-arrow">
              在套餐比较表中对比{brand.name}与其他品牌
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/compare/budget-airport-plans-2026/" className="link-arrow">
              预算有限怎么选：12 家机场低价套餐价格对比
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section id="profile" className="scroll-mt-24" aria-labelledby="profile-title">
          <span className="section-kicker">Profile</span>
          <h2 id="profile-title" className="section-title mb-6">
            {brand.name}资料档案
          </h2>
          <BrandProfile brand={brand} showCta={false} showIntro={!ed} showSources={false} />
        </section>

        {hasVerification && (
          <section id="verification" className="scroll-mt-24" aria-labelledby="verification-title">
            <span className="section-kicker">Verification</span>
            <h2 id="verification-title" className="section-title mb-6">
              {brand.name}资料核验与矛盾
            </h2>
            <BrandVerification brand={brand} />
          </section>
        )}

        <section id="purchase" className="scroll-mt-24" aria-labelledby="purchase-title">
          <span className="section-kicker">Purchase</span>
          <h2 id="purchase-title" className="section-title">
            {brand.name}购买流程（资料原文整理）
          </h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <ol className="card list-decimal space-y-2 p-6 pl-10 text-sm text-ink-soft">
              {brand.purchaseSteps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <div className="brand-gradient rounded-2xl p-6 text-white">
              <p className="text-sm font-semibold uppercase tracking-wider text-sky">{brandEntryWord(brand) === "官网" ? "官网入口" : "注册入口"}</p>
              <p className="mt-2 text-sm text-white/90">
                {brandEntryWord(brand) === "官网"
                  ? "只通过官网注册购买，价格与优惠以结算页为准；网上出售的订阅链接、网盘分发的客户端均非官方渠道。第一次购买建议先选月付或最小套餐。"
                  : "资料称独立官网域名尚未确认，本站只提供站长给出的注册入口；价格与优惠以结算页为准，网上出售的订阅链接、网盘分发的客户端均非官方渠道。第一次购买建议先选月付或最小套餐。"}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {brand.relationship === "sponsored" ? <BrandCTA brand={brand} label={`前往${brandRegisterLabel(brand)}`} variant="light" /> : <span className="text-sm">本站未提供购买链接</span>}
                {brand.coupon && (
                  <span className="text-sm text-white/90">
                    优惠码 <code className="rounded bg-white/20 px-1.5 py-0.5 font-mono font-bold">{brand.coupon.code}</code>
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {fm?.faq.length ? (
          <section id="faq" className="scroll-mt-24" aria-labelledby="faq-title">
            <span className="section-kicker">FAQ</span>
            <h2 id="faq-title" className="section-title mb-6">
              {brand.name}常见问题
            </h2>
            <Faq items={fm.faq} />
          </section>
        ) : null}

        <BrandSources brand={brand} publishedAt={publishedAt} updatedAt={updatedAt} changes={fm?.changes} />

        {related.length > 0 && (
          <section id="related" className="scroll-mt-24" aria-labelledby="related-title">
            <span className="section-kicker">Related</span>
            <h2 id="related-title" className="section-title mb-6">
              {brand.name}相关阅读
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {related.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
