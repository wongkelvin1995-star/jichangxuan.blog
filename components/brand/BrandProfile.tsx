import Link from "next/link";

import { StatusBadge } from "@/components/ui/Badge";
import { brandDisclosureText, brandPath, brandRegisterLabel, dataStatusLabel, type Brand } from "@/lib/brands";
import { formatDate } from "@/lib/format";
import { getEntryPlan } from "@/lib/plans";

import { BrandCTA } from "./BrandCTA";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-xl border border-line-soft bg-bg px-3 py-2.5">
      <dt className="field-label">{label}</dt>
      <dd className={`mt-0.5 text-sm ${value ? "text-ink" : "data-pending"}`}>{value ?? "待核实"}</dd>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
      {items.map((a) => (
        <li key={a} className="flex gap-2">
          <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
          {a}
        </li>
      ))}
    </ul>
  );
}

export const SOURCE_TYPE_LABEL = {
  "owner-supplied": "站长提供的品牌资料（价目表与服务说明）",
  "owner-measured": "站长的实测截图 / 报告图",
  "promotional-copy": "品牌宣传文案（只作参考，不作为事实依据）",
  "third-party": "第三方公开资料",
} as const;

/** 品牌资料档案：节点、线路、设备、客户端、流媒体声称、客服政策、资料来源与核实状态 */
export function BrandProfile({
  brand,
  showCta = true,
  headingId,
  showIntro = true,
  showSources = true,
}: {
  brand: Brand;
  showCta?: boolean;
  headingId?: string;
  /** 品牌页页头已经显示定位语与简介时传 false，避免同页重复 */
  showIntro?: boolean;
  /** 品牌页有单独的“资料来源与更新记录”时传 false */
  showSources?: boolean;
}) {
  const status = dataStatusLabel(brand);
  const entry = brand.dataStatus === "pending" ? null : getEntryPlan(brand.id);
  const nodeValue = brand.nodeCount
    ? `${brand.nodeCount} 个${brand.nodeCountByRegion ? `（${Object.entries(brand.nodeCountByRegion).map(([k, v]) => `${k} ${v}`).join("、")}）` : ""}`
    : brand.nodeCountByRegion
      ? `各地区：${Object.entries(brand.nodeCountByRegion).map(([k, v]) => `${k} ${v}`).join("、")}（总数待核实）`
      : null;

  return (
    <section id={`brand-${brand.slug}`} className="card scroll-mt-24 p-6 md:p-8" aria-labelledby={headingId ?? `brand-profile-${brand.slug}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id={headingId ?? `brand-profile-${brand.slug}`} className="text-2xl font-bold text-ink">
            {brand.name}
            {brand.nameEn && brand.nameEn !== brand.name && (
              <span className="ml-2 text-sm font-semibold uppercase tracking-wider text-muted"> {brand.nameEn}</span>
            )}
          </h3>
          {showIntro && brand.tagline && <p className="mt-1 text-sm text-ink-soft">{brand.tagline}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge kind={status.kind} />
          {brand.relationship === "sponsored" && <StatusBadge kind="sponsored" />}
        </div>
      </div>

      {showIntro && <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">{brand.summary}</p>}
      <p className="mt-2 text-xs text-muted">{status.description}。</p>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="节点地区（资料列出）" value={brand.regions.length ? brand.regions.join("、") : null} />
        <Field label="节点数量" value={nodeValue} />
        <Field label="线路类型" value={brand.lineTypes.length ? brand.lineTypes.join("；") : null} />
        <Field label="倍率" value={brand.ratio} />
        <Field label="同时在线设备" value={brand.deviceLimit} />
        <Field label="支持系统" value={brand.supportedPlatforms?.length ? brand.supportedPlatforms.join("、") : null} />
        <Field label="入门套餐" value={entry ? `${entry.plan} ¥${entry.price} / ${entry.cycleLabel}（${entry.trafficLabel}）` : null} />
        <Field label="优惠码" value={brand.coupon ? `${brand.coupon.code}${brand.coupon.discount ? `（${brand.coupon.discount}）` : "（折扣以结算页为准）"}` : null} />
        <Field label="资料日期" value={formatDate(brand.materialDate)} />
      </dl>
      {brand.nodeCountNote && <p className="mt-2 text-xs text-muted">节点说明：{brand.nodeCountNote}</p>}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="text-sm font-bold text-ink">适合人群（资料列出）</h4>
          <BulletList items={brand.audiences} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-ink">客户端与使用方式</h4>
          <BulletList items={brand.clientPolicy} />
        </div>
      </div>

      {(brand.streaming.length > 0 || brand.aiTools.length > 0) && (
        <div className="mt-6">
          <h4 className="text-sm font-bold text-ink">
            {brand.id === "lingdongyun" ? "流媒体与 AI（资料声称；其中部分有本站检测记录，见测试记录）" : "流媒体与 AI（资料声称，本站未测试）"}
          </h4>
          <dl className="mt-2 grid gap-3 sm:grid-cols-2">
            <Field label="流媒体" value={brand.streaming.length ? brand.streaming.join("、") : null} />
            <Field label="AI 工具" value={brand.aiTools.length ? brand.aiTools.join("、") : null} />
          </dl>
          {brand.otherServices.length > 0 && <p className="mt-2 text-sm text-ink-soft">其他：{brand.otherServices.join("；")}</p>}
          {brand.streamingNote && <p className="mt-1 text-xs text-muted">{brand.streamingNote}</p>}
        </div>
      )}

      {brand.trafficRules.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-bold text-ink">流量规则（资料原文整理）</h4>
          <BulletList items={brand.trafficRules} />
        </div>
      )}

      {brand.support && (
        <div className="mt-6">
          <h4 className="text-sm font-bold text-ink">客服与支持政策</h4>
          <dl className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="客服渠道" value={brand.support.channels.length ? brand.support.channels.join("、") : null} />
            <Field label="客服时间" value={brand.support.hours} />
            <Field label="退款" value={brand.support.refund} />
            <Field label="试用" value={brand.support.trial} />
            <Field label="付款方式" value={brand.support.payment} />
            <Field label="防骗提醒" value={brand.support.antiFraud} />
          </dl>
        </div>
      )}

      {brand.marketingClaims.length > 0 && (
        <div className="mt-6 rounded-xl border border-line bg-white p-4 text-sm text-ink-soft">
          <p className="font-semibold text-ink">资料中的宣传性说法（未经本站测试）</p>
          <ul className="mt-1 list-disc pl-5">
            {brand.marketingClaims.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {(brand.caveats.length > 0 || brand.conflicts.length > 0) && (
        <div className="mt-6 rounded-xl border border-warning/30 bg-warning-bg/60 p-4 text-sm text-ink-soft">
          <p className="font-semibold text-ink">资料缺口与矛盾</p>
          <ul className="mt-1 list-disc pl-5">
            {brand.conflicts.map((c) => (
              <li key={c}>{c}</li>
            ))}
            {brand.caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {showSources && (
        <div className="mt-6 border-t border-line-soft pt-4 text-xs text-muted">
          <p className="font-semibold text-ink-soft">资料来源</p>
          <ul className="mt-1 space-y-0.5">
            {brand.sources.map((s) => (
              <li key={s.file}>
                {s.date} · {SOURCE_TYPE_LABEL[s.type]}
                {s.note ? `（${s.note}）` : ""}
              </li>
            ))}
            {brand.externalSources.length > 0 && (
              <li>
                另有 {brand.externalSources.length} 份第三方公开资料（{brand.externalSources[0].retrievedAt} 检索），仅用于标注差异，本站不据此修改价格，也不作为事实依据。
              </li>
            )}
          </ul>
          <p className="mt-2">
            {brandDisclosureText(brand)}{" "}
            <Link href="/disclosure/" className="font-semibold text-brand-strong underline underline-offset-2">
              商业关系披露
            </Link>
          </p>
        </div>
      )}

      {showCta && (
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={brandPath(brand)} className="btn btn-secondary">
            {brand.hubPath ? `进入${brand.name}专区` : `${brand.name}资料页`}
          </Link>
          {brand.relationship === "sponsored" && <BrandCTA brand={brand} label={brandRegisterLabel(brand)} />}
        </div>
      )}
    </section>
  );
}
