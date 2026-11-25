import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { brandDisclosureText, brandPath, brandRegisterLabel, dataStatusLabel, getBrand } from "@/lib/brands";
import { formatDate } from "@/lib/format";
import { getEntryPlan } from "@/lib/plans";

import { BrandCTA } from "./BrandCTA";

/**
 * 文章内的相关品牌推荐卡片。显示入门套餐（已核对 / 原稿参考价）、优惠码、专区或资料页链接与推广披露。
 */
export function InlineBrandRecommendation({ brand: brandId, note }: { brand: string; note?: string }) {
  const brand = getBrand(brandId);
  if (!brand || !brand.published) return null;
  const status = dataStatusLabel(brand);
  const entry = brand.dataStatus === "pending" ? null : getEntryPlan(brand.id);
  return (
    <aside
      className="not-prose my-10 overflow-hidden rounded-2xl border border-brand/25 bg-gradient-to-br from-sky-soft via-white to-white"
      aria-label={`相关品牌推荐：${brand.name}`}
    >
      <div className="p-5 md:p-6">
        <p className="field-label">
          相关品牌推荐 · {brand.relationship === "sponsored" ? "推广合作" : "无合作关系"} · {status.label}
        </p>
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-xl font-bold text-ink">
              {brand.name}
              {brand.nameEn && brand.nameEn !== brand.name && <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-muted"> {brand.nameEn}</span>}
            </p>
            <p className="mt-1 text-sm text-ink-soft">{note ?? brand.tagline ?? brand.summary}</p>
            <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <div>
                <dt className="inline text-muted">入门套餐：</dt>
                <dd className="inline font-semibold text-ink">{entry ? `${entry.plan} ¥${entry.price} / ${entry.cycleLabel}（${entry.trafficLabel}）` : "待核实"}</dd>
              </div>
              {brand.coupon && (
                <div>
                  <dt className="inline text-muted">优惠码：</dt>
                  <dd className="inline font-mono font-semibold text-brand-deep">
                    {brand.coupon.code}
                    {brand.coupon.discount ? `（${brand.coupon.discount}）` : ""}
                  </dd>
                </div>
              )}
              <div>
                <dt className="inline text-muted">{brand.dataStatus === "verified" ? "价格核对：" : "资料日期："}</dt>
                <dd className="inline text-ink">{formatDate(brand.verifiedAt ?? brand.materialDate)}</dd>
              </div>
            </dl>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
            <Link href={brandPath(brand)} className="btn btn-secondary btn-sm">
              {brand.hubPath ? `${brand.name}专区` : `${brand.name}资料页`}
              <ArrowRight size={14} aria-hidden="true" className="btn-arrow" />
            </Link>
            {brand.relationship === "sponsored" && <BrandCTA brand={brand} label={brandRegisterLabel(brand)} size="sm" />}
          </div>
        </div>
      </div>
      <p className="border-t border-brand/15 bg-white/70 px-5 py-2.5 text-xs leading-relaxed text-muted md:px-6">
        {brandDisclosureText(brand)}{" "}
        <Link href="/disclosure/" className="font-semibold text-brand-strong underline underline-offset-2">
          商业关系披露
        </Link>
      </p>
    </aside>
  );
}
