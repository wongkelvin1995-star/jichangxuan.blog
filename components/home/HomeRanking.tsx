import { ArrowRight, Info } from "lucide-react";
import Link from "next/link";

import { BrandCTA } from "@/components/brand/BrandCTA";
import { StatusBadge } from "@/components/ui/Badge";
import { brandEntryWord, brandPath, dataStatusLabel, getBrand, getPublishedBrands } from "@/lib/brands";
import { formatDate } from "@/lib/format";
import { CLIENT_SHORT, RANKING_NOTES } from "@/lib/home-content";
import { getEntryPlan } from "@/lib/plans";
import { HOME_RANKING, RANKING_DISCLOSURE, RANKING_TITLE, RANKING_UPDATED_AT } from "@/lib/ranking";
import { reviewPathForBrand } from "@/lib/reviews";

/**
 * 首页 H2「2026 热门机场推荐排行榜」。顺序只来自 lib/ranking.ts（站主指定），组件里不排序。
 * 每项 H3 文字与站主指令逐字一致，并链接到对应品牌的独立页面。
 */
export function HomeRanking() {
  const items = HOME_RANKING.map((r) => ({ r, brand: getBrand(r.brandId) })).filter(
    (x): x is { r: (typeof HOME_RANKING)[number]; brand: NonNullable<ReturnType<typeof getBrand>> } => !!x.brand,
  );

  return (
    <section id="ranking" className="scroll-mt-24 border-y border-line-soft bg-white py-12 md:py-16" aria-labelledby="ranking-title">
      <div className="container-x">
        <span className="section-kicker">Ranking</span>
        <h2 id="ranking-title" className="section-title">
          {RANKING_TITLE}
        </h2>
        <div className="mt-4 flex gap-3 rounded-xl border border-brand/25 bg-sky-soft/70 p-4 text-sm leading-relaxed text-ink-soft" role="note">
          <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-brand" />
          <p>
            {RANKING_DISCLOSURE}排序依据见
            <Link href="/methodology/#ranking" className="mx-0.5 font-semibold text-brand-strong underline underline-offset-2">
              推荐榜排序原则
            </Link>
            ，合作关系见
            <Link href="/disclosure/#ranking" className="mx-0.5 font-semibold text-brand-strong underline underline-offset-2">
              商业关系披露
            </Link>
            。榜单顺序更新于 <time dateTime={RANKING_UPDATED_AT}>{formatDate(RANKING_UPDATED_AT)}</time>。
          </p>
        </div>

        <ol className="mt-8 space-y-5">
          {items.map(({ r, brand }) => {
            const entry = getEntryPlan(brand.id);
            const status = dataStatusLabel(brand);
            const href = brandPath(brand);
            // 地区数按“写了节点数的地区”计算；资料另列但没写数量的地区单独说明，不并入总数
            const counted = brand.nodeCountByRegion ? Object.keys(brand.nodeCountByRegion).length : 0;
            const uncounted = counted ? brand.regions.length - counted : 0;
            const nodes = brand.nodeCount
              ? counted
                ? `${brand.nodeCount} 个（${counted} 个地区${uncounted > 0 ? `；另列 ${uncounted} 个地区未写数量` : ""}）`
                : `${brand.nodeCount} 个（资料列出 ${brand.regions.length} 个地区，各地区数量未写）`
              : `${brand.nodeCountNote ?? "资料未写"}`;
            return (
              <li key={r.brandId} className="card p-5 md:p-6" aria-labelledby={`rank-${r.brandId}`}>
                <div className="grid gap-5 lg:grid-cols-[64px_minmax(0,1fr)_220px] lg:items-start">
                  <span aria-hidden="true" className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-sky-soft text-2xl font-bold text-brand-deep lg:flex">
                    {String(r.rank).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3 id={`rank-${r.brandId}`} className="text-xl font-bold text-ink">
                      <Link href={href} className="transition-colors hover:text-brand-strong">
                        {r.heading}
                      </Link>
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {brand.relationship === "sponsored" && <StatusBadge kind="sponsored" />}
                      <StatusBadge kind={status.kind} />
                      <span className="chip chip-outline">
                        {r.displayName}
                        {brand.nameEn && !r.displayName.includes(brand.nameEn) ? ` · ${brand.nameEn}` : ""}
                      </span>
                    </div>
                    <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">{RANKING_NOTES[brand.id] ?? brand.summary}</p>
                    <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="field-label">入门月付</dt>
                        <dd className="mt-0.5 text-ink">
                          {entry ? (
                            <>
                              <span className="whitespace-nowrap font-semibold">
                                ¥{entry.price} / {entry.cycleLabel}
                              </span>{" "}
                              · {entry.plan} {entry.trafficLabel}
                              <span className="block text-xs text-muted">
                                {entry.status === "verified" ? `已核对 ${formatDate(entry.statusDate)}` : `原稿参考价 · 资料日期 ${formatDate(entry.statusDate)}`}
                              </span>
                            </>
                          ) : (
                            <span className="data-pending">待核实</span>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="field-label">线路（资料）</dt>
                        <dd className="mt-0.5 text-ink">{brand.lineTypes.length ? brand.lineTypes.join("；") : "资料未写"}</dd>
                      </div>
                      <div>
                        <dt className="field-label">节点</dt>
                        <dd className="mt-0.5 text-ink">{nodes}</dd>
                      </div>
                      <div>
                        <dt className="field-label">客户端</dt>
                        <dd className="mt-0.5 text-ink">{CLIENT_SHORT[brand.id] ?? brand.clientPolicy[0] ?? "资料未写"}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                    <Link href={href} className="btn btn-secondary btn-sm">
                      {brand.name}{brand.hubPath ? "专区" : "资料"}、套餐与教程
                      <ArrowRight size={14} aria-hidden="true" className="btn-arrow" />
                    </Link>
                    {brand.relationship === "sponsored" && <BrandCTA brand={brand} label={`前往${brand.name}${brandEntryWord(brand)}`} size="sm" variant="primary" />}
                    {reviewPathForBrand(brand.id) && (
                      <Link href={reviewPathForBrand(brand.id)!} className="link-arrow justify-center text-sm">
                        阅读{brand.name}测评
                        <ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-6 text-sm text-muted">
          榜单之外的 {getPublishedBrands().length - items.length} 个品牌收录在
          <Link href="/brands/" className="mx-0.5 font-semibold text-brand-strong underline underline-offset-2">
            机场品牌资料库
          </Link>
          ，价格同样标明核对日期。各家的资料分析与选购建议见
          <Link href="/reviews/" className="mx-0.5 font-semibold text-brand-strong underline underline-offset-2">
            2026 机场测评专区
          </Link>
          。
        </p>
      </div>
    </section>
  );
}
