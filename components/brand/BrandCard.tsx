import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/Badge";
import { brandPath, dataStatusLabel, type Brand } from "@/lib/brands";
import { formatDate } from "@/lib/format";
import { getEntryPlan } from "@/lib/plans";
import { rankOf } from "@/lib/ranking";

/** 品牌资料卡（品牌资料库网格）。上榜品牌显示首页推荐榜名次（编辑推荐，含推广合作因素） */
export function BrandCard({ brand, headingLevel = "h3" }: { brand: Brand; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const status = dataStatusLabel(brand);
  const entry = brand.dataStatus === "pending" ? null : getEntryPlan(brand.id);
  const href = brandPath(brand);
  const rank = rankOf(brand.id);
  return (
    <article className="card card-hover flex h-full flex-col p-6" aria-labelledby={`brand-card-${brand.slug}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {rank !== undefined && <span className="field-label">首页推荐榜第 {rank} 名</span>}
          <Heading id={`brand-card-${brand.slug}`} className="mt-1 text-xl font-bold text-ink">
            <Link href={href} className="transition-colors hover:text-brand-strong">
              {brand.name}
            </Link>
            {brand.nameEn && brand.nameEn !== brand.name && (
              <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-muted"> {brand.nameEn}</span>
            )}
          </Heading>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge kind={status.kind} />
          {brand.relationship === "sponsored" && <StatusBadge kind="sponsored" />}
        </div>
      </div>

      <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-ink-soft">{brand.summary}</p>

      <div className="mt-4">
        <p className="field-label">适合人群（资料列出）</p>
        <ul className="mt-1.5 space-y-1 text-sm text-ink">
          {brand.audiences.slice(0, 3).map((a) => (
            <li key={a} className="flex gap-2">
              <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-xl border border-line-soft bg-bg p-3 text-sm">
        <p className="field-label">{brand.dataStatus === "verified" ? "套餐信息（价格已核对）" : "套餐信息（原稿参考价）"}</p>
        {entry ? (
          <>
            <p className="mt-1 font-semibold text-ink">
              {entry.plan}：¥{entry.price} / {entry.cycleLabel}，{entry.trafficLabel}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {entry.status === "verified" ? `价格核对日期 ${formatDate(entry.statusDate)}` : `资料日期 ${formatDate(entry.statusDate)}，未在品牌后台核实`} · 以官网结算页为准
            </p>
          </>
        ) : (
          <p className="mt-1 data-pending">待核实 · 核实后才会展示价格与流量</p>
        )}
      </div>

      <div className="mt-auto pt-5">
        <Link href={href} className="link-arrow text-sm">
          {brand.hubPath ? `进入${brand.name}专区` : `${brand.name}资料、套餐与政策`}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
