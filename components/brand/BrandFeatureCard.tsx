import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";

import { brandDisclosureText, brandPath, type Brand } from "@/lib/brands";
import { getArticleBySlug, getSpeedtestReportsByRegion } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { getBrandPlans, getEntryPlan } from "@/lib/plans";

import { BrandCTA } from "./BrandCTA";

/**
 * 首页 H2「灵动云机场介绍、套餐与使用体验」：首推品牌的完整模块。
 * 品牌介绍、套餐价格与周期、节点地区与线路、适合人群、客户端支持、使用教程、测试记录、常见问题与购买入口，
 * 全部取自 data/brands.json、data/plans.json 与本站文章，不在组件里写死数字。
 */
export function BrandFeatureCard({ brand }: { brand: Brand }) {
  const entry = getEntryPlan(brand.id);
  const plans = getBrandPlans(brand.id);
  const hub = brandPath(brand);
  const statusText =
    brand.dataStatus === "verified" ? `价格核对日期 ${formatDate(brand.verifiedAt ?? brand.materialDate)}` : `原稿参考价，资料日期 ${formatDate(brand.materialDate)}`;
  const facts = [
    brand.regions.length ? { label: "节点地区", value: `${brand.regions.length} 个地区` } : null,
    brand.nodeCount ? { label: "节点数量", value: `${brand.nodeCount} 个` } : null,
    brand.deviceLimit ? { label: "设备数", value: brand.deviceLimit } : null,
    brand.ratio ? { label: "倍率", value: brand.ratio } : null,
  ].filter((f): f is { label: string; value: string } => !!f);
  const records = [...new Map([...getSpeedtestReportsByRegion().values()].flat().map((a) => [a.path, a])).values()]
    .filter((a) => a.frontmatter.brand === brand.id && a.frontmatter.test)
    .sort((a, b) => b.frontmatter.test!.testedAt.localeCompare(a.frontmatter.test!.testedAt));
  const review = getArticleBySlug("lingdongyun-review-2026");
  const clientGuide = getArticleBySlug("lingdongyun-client-guide");

  return (
    <section id="lingdongyun-intro" className="container-x scroll-mt-24 py-6 md:py-10" aria-labelledby="brand-feature-title">
      <div className="brand-gradient relative overflow-hidden rounded-2xl text-white shadow-[0_24px_60px_-30px_rgba(30,64,175,0.7)]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <svg className="absolute -right-10 -top-16 h-[360px] w-[520px] opacity-30" viewBox="0 0 520 360" fill="none">
            <circle cx="380" cy="160" r="150" stroke="#fff" strokeOpacity="0.35" />
            <circle cx="380" cy="160" r="96" stroke="#fff" strokeOpacity="0.3" />
            <circle cx="380" cy="160" r="40" stroke="#fff" strokeOpacity="0.4" />
            <path d="M0 300C120 220 220 320 360 230S480 120 540 160" stroke="#fff" strokeOpacity="0.4" strokeWidth="2" />
          </svg>
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-white/10 to-transparent" />
        </div>

        <div className="relative grid gap-8 p-6 md:grid-cols-[1.5fr_1fr] md:p-10">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide">
              <Sparkles size={14} aria-hidden="true" />
              首页首推 · 推广合作
            </span>
            <h2 id="brand-feature-title" className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
              {brand.name}机场介绍、套餐与使用体验
            </h2>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-sky">
              {brand.name} {brand.nameEn}
            </p>
            {brand.tagline && <p className="mt-2 text-base font-medium text-sky">{brand.tagline}</p>}
            <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-white/90">{brand.summary}</p>
            {facts.length > 0 && (
              <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {facts.map((f) => (
                  <div key={f.label} className="rounded-xl bg-white/10 px-3 py-2.5">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-sky">{f.label}</dt>
                    <dd className="mt-0.5 text-sm font-semibold">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={`${hub}#plans`} className="btn bg-white text-brand-deep shadow-sm hover:bg-sky">
                {brand.name}套餐与优惠码
                <ArrowRight size={16} aria-hidden="true" className="btn-arrow" />
              </Link>
              <Link href="/lingdongyun/lingdongyun-client-guide/" className="btn border border-white/40 text-white hover:bg-white/10">
                <BookOpen size={16} aria-hidden="true" />
                {brand.name}客户端教程
              </Link>
              <BrandCTA brand={brand} label={`前往${brand.name}官网注册`} variant="light" className="sm:ml-auto" />
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-[2px]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-sky">入门套餐</p>
            {entry ? (
              <div className="mt-2">
                <p className="text-2xl font-bold">
                  ¥{entry.price}
                  <span className="ml-1 text-sm font-medium text-white/80">/ {entry.cycleLabel}</span>
                </p>
                <p className="mt-1 text-sm text-white/90">
                  {entry.plan} · {entry.trafficLabel}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm">套餐信息待核实</p>
            )}
            {brand.coupon && (
              <div className="mt-4 rounded-xl border border-white/25 bg-white/5 p-3 text-sm">
                <p>
                  优惠码 <code className="rounded bg-white/20 px-1.5 py-0.5 font-mono text-base font-bold tracking-wider">{brand.coupon.code}</code>{" "}
                  <span className="text-white/90">{brand.coupon.discount ?? "折扣以结算页为准"}</span>
                </p>
                {(brand.coupon.appliesTo.length > 0 || brand.coupon.excludes.length > 0) && (
                  <p className="mt-1 text-xs text-white/80">
                    {brand.coupon.appliesTo.length > 0 && `适用：${brand.coupon.appliesTo.join("、")}`}
                    {brand.coupon.appliesTo.length > 0 && brand.coupon.excludes.length > 0 && "；"}
                    {brand.coupon.excludes.length > 0 && `不适用：${brand.coupon.excludes.join("、")}`}
                  </p>
                )}
              </div>
            )}
            <p className="mt-4 text-xs text-white/80">{statusText}。价格与优惠以官网结算页为准。</p>
            <Link href={hub} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-white underline-offset-4 hover:underline">
              进入{brand.name}专区
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <p className="relative border-t border-white/15 px-6 py-3 text-xs leading-relaxed text-white/85 md:px-10">
          <strong className="font-semibold">披露：</strong>
          {brandDisclosureText(brand)}{" "}
          <Link href="/disclosure/" className="font-semibold underline underline-offset-2">
            商业关系披露
          </Link>
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <h3 className="text-base font-bold text-ink">套餐价格与周期</h3>
          {plans && plans.periodic.length > 0 ? (
            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
              {plans.periodic.map((t) => (
                <li key={t.plan} className="flex justify-between gap-3">
                  <span>
                    {t.plan} · {t.trafficGb} GB / 月
                  </span>
                  <span className="font-semibold text-ink">{t.prices.monthly !== undefined ? `¥${t.prices.monthly} / 月` : "待核实"}</span>
                </li>
              ))}
              {plans.yearlySmall.map((s) => (
                <li key={s.plan} className="flex justify-between gap-3">
                  <span>
                    {s.plan} · {s.trafficGb} GB / 月
                  </span>
                  <span className="font-semibold text-ink">¥{s.price} / 年</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">套餐待核实</p>
          )}
          {plans?.cycleDiscounts && <p className="mt-3 text-xs text-muted">长周期：{plans.cycleDiscounts}</p>}
          <p className="mt-1 text-xs text-muted">{statusText}</p>
        </div>

        <div className="card p-5">
          <h3 className="text-base font-bold text-ink">节点地区与线路</h3>
          {brand.nodeCountByRegion ? (
            <ul className="mt-3 grid grid-cols-2 gap-1.5 text-sm text-ink-soft">
              {Object.entries(brand.nodeCountByRegion).map(([region, count]) => (
                <li key={region}>
                  {region} <span className="font-semibold text-ink">{count}</span> 个
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">{brand.regions.join("、")}</p>
          )}
          <p className="mt-3 text-sm text-ink-soft">线路：{brand.lineTypes.join("；")}</p>
          {brand.ratio && <p className="mt-1 text-sm text-ink-soft">{brand.ratio}</p>}
          <Link href="/speedtest/node-regions-explained/" className="link-arrow mt-3 text-sm">
            节点地区怎么选
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>

        <div className="card p-5">
          <h3 className="text-base font-bold text-ink">适合人群与客户端</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            {brand.audiences.slice(0, 3).map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            {brand.clientPolicy.slice(0, 2).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          {clientGuide && (
            <Link href={clientGuide.path} className="link-arrow mt-3 text-sm">
              {brand.name}客户端使用教程
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-base font-bold text-ink">使用体验与测试记录</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {records.map((r) => (
              <li key={r.path}>
                <Link href={r.path} className="font-medium text-ink hover:text-brand-strong">
                  {r.frontmatter.title}
                </Link>
                <span className="block text-xs text-muted">
                  {formatDate(r.frontmatter.test!.testedAt.slice(0, 10))} · {r.frontmatter.test!.tool}
                </span>
              </li>
            ))}
            {review && (
              <li>
                <Link href={review.path} className="font-medium text-ink hover:text-brand-strong">
                  {review.frontmatter.title}
                </Link>
              </li>
            )}
          </ul>
          <p className="mt-3 text-xs text-muted">不同时段、不同网络的测试结果不能直接比较；每份记录都写明了局限。</p>
          <Link href={`${hub}#faq`} className="link-arrow mt-2 text-sm">
            {brand.name}常见问题
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
