import { CalendarDays, FileText, RefreshCw } from "lucide-react";
import Link from "next/link";

import { SOURCE_TYPE_LABEL } from "@/components/brand/BrandProfile";
import { brandDisclosureText, type Brand } from "@/lib/brands";
import { formatDate } from "@/lib/format";

/**
 * 品牌页「资料来源与更新记录」：读者能看懂的来源说明（不显示仓库内部文件路径）、
 * 页面发布 / 更新日期、资料日期、价格核对状态与修改记录。
 */
export function BrandSources({
  brand,
  publishedAt,
  updatedAt,
  changes = [],
  id = "sources",
}: {
  brand: Brand;
  publishedAt: string;
  updatedAt: string;
  changes?: { date: string; note: string }[];
  id?: string;
}) {
  const sorted = [...changes].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <section id={id} className="scroll-mt-24" aria-labelledby={`${id}-title`}>
      <span className="section-kicker">Sources</span>
      <h2 id={`${id}-title`} className="section-title">
        {brand.name}资料来源与更新记录
      </h2>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5 text-sm text-ink-soft">
          <h3 className="flex items-center gap-1.5 text-base font-bold text-ink">
            <FileText size={16} aria-hidden="true" />
            资料来源与核实说明
          </h3>
          <ul className="mt-3 space-y-1.5">
            {brand.sources.map((s) => (
              <li key={s.file}>
                <span className="font-medium text-ink">{formatDate(s.date)}</span> · {SOURCE_TYPE_LABEL[s.type]}
                {s.note ? `：${s.note}` : ""}
              </li>
            ))}
            {brand.externalSources.length > 0 && (
              <li>
                另有 {brand.externalSources.length} 份第三方公开资料（{formatDate(brand.externalSources[0].retrievedAt)} 检索），只用于标注差异，不作为事实依据。
              </li>
            )}
          </ul>
          <p className="mt-3">
            {brand.dataStatus === "verified"
              ? `价格已于 ${formatDate(brand.verifiedAt ?? brand.materialDate)} 由站长在品牌官网或用户后台逐项核对；节点、线路、客户端与售后等其他内容来自品牌资料（资料日期 ${formatDate(brand.materialDate)}），没写或有冲突的项目标“待核实”。`
              : `价格为原稿参考价：资料日期 ${formatDate(brand.materialDate)}，尚未在品牌后台核实，购买前以官网结算页为准。`}
            速度、稳定性与流媒体、AI 工具的可用性是品牌说法，除非页面另有本站测试记录。
          </p>
          <p className="mt-3 text-xs text-muted">
            {brandDisclosureText(brand)} 核实方法见
            <Link href="/methodology/" className="mx-0.5 font-semibold text-brand-strong underline underline-offset-2">
              测评方法
            </Link>
            ，纠错方式见
            <Link href="/contact/" className="mx-0.5 font-semibold text-brand-strong underline underline-offset-2">
              联系与纠错
            </Link>
            。
          </p>
        </div>
        <div className="card p-5 text-sm text-ink-soft">
          <h3 className="flex items-center gap-1.5 text-base font-bold text-ink">
            <CalendarDays size={16} aria-hidden="true" />
            页面日期与修改记录
          </h3>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line-soft bg-bg px-3 py-2">
              <dt className="field-label">发布</dt>
              <dd className="mt-0.5 text-ink">
                <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
              </dd>
            </div>
            <div className="rounded-xl border border-line-soft bg-bg px-3 py-2">
              <dt className="field-label">最后更新</dt>
              <dd className="mt-0.5 text-ink">
                <time dateTime={updatedAt}>{formatDate(updatedAt)}</time>
              </dd>
            </div>
            <div className="rounded-xl border border-line-soft bg-bg px-3 py-2">
              <dt className="field-label">资料日期</dt>
              <dd className="mt-0.5 text-ink">{formatDate(brand.materialDate)}</dd>
            </div>
            <div className="rounded-xl border border-line-soft bg-bg px-3 py-2">
              <dt className="field-label">价格核对</dt>
              <dd className="mt-0.5 text-ink">{brand.verifiedAt ? formatDate(brand.verifiedAt) : "未核对（原稿参考价）"}</dd>
            </div>
          </dl>
          {sorted.length > 0 && (
            <ol className="mt-4 space-y-2">
              {sorted.map((c) => (
                <li key={c.date + c.note} className="flex gap-2">
                  <RefreshCw size={14} aria-hidden="true" className="mt-1 shrink-0 text-brand" />
                  <span>
                    <time dateTime={c.date} className="font-medium text-ink">
                      {formatDate(c.date)}
                    </time>
                    ：{c.note}
                  </span>
                </li>
              ))}
            </ol>
          )}
          <Link href="/updates/" className="link-arrow mt-4 text-sm">
            全站更新记录
          </Link>
        </div>
      </div>
    </section>
  );
}
