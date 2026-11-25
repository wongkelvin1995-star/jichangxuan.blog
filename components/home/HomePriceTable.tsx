import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { brandPath, getBrand } from "@/lib/brands";
import { formatDate } from "@/lib/format";
import { getPlanRowsByBrand } from "@/lib/plans";
import { HOME_RANKING } from "@/lib/ranking";
import { reviewPathForBrand } from "@/lib/reviews";

const NBSP = " ";

/**
 * 首页 H2「十二家热门机场套餐价格比较」：服务端渲染的静态表（不加载客户端脚本）。
 * 每行：入门月付、按月付折算的每 GB 单价、年付小包、最便宜的不限时流量包、设备政策、价格状态。
 * 单价由本站按资料价格计算；完整套餐在 /compare/ 与各品牌页。
 */
export function HomePriceTable() {
  const rows = HOME_RANKING.map((r) => {
    const brand = getBrand(r.brandId);
    if (!brand) return null;
    const planRows = getPlanRowsByBrand(brand.id);
    const periodic = planRows.filter((p) => p.kind === "periodic");
    const minTraffic = periodic.length ? Math.min(...periodic.map((p) => p.trafficGb ?? Infinity)) : null;
    const entry = periodic.find((p) => p.trafficGb === minTraffic && p.cycle === "monthly") ?? periodic.find((p) => p.trafficGb === minTraffic);
    const small = planRows.find((p) => p.kind === "yearly-small");
    const pack = planRows.filter((p) => p.kind === "data-pack").sort((a, b) => a.price - b.price)[0];
    const top = periodic.length ? Math.max(...periodic.map((p) => p.trafficGb ?? 0)) : null;
    return { r, brand, entry, small, pack, top, status: entry?.status ?? small?.status, statusDate: entry?.statusDate ?? small?.statusDate };
  }).filter((x): x is NonNullable<typeof x> => !!x);

  return (
    <section id="prices" className="container-x scroll-mt-24 py-12 md:py-16" aria-labelledby="prices-title">
      <span className="section-kicker">Prices</span>
      <h2 id="prices-title" className="section-title">
        十二家热门机场套餐价格比较
      </h2>
      <p className="section-desc">
        按首页推荐榜顺序列出入门月付、年付小包和最便宜的不限时流量包。“每 GB”由机场优选按月付价格除以每月流量计算，不是品牌公布的数据；价格于 2026 年 11 月 25 日由站长在各品牌官网或用户后台核对，购买前以官网结算页为准。
      </p>
      <div className="table-wrap mt-6">
        <table className="plan-table">
          <caption className="sr-only">十二家机场入门套餐、年付小包与不限时流量包价格（含价格状态与资料日期）</caption>
          <thead>
            <tr>
              <th scope="col">品牌</th>
              <th scope="col">入门月付</th>
              <th scope="col">每 GB（月付）</th>
              <th scope="col">最大月流量档</th>
              <th scope="col">年付小包</th>
              <th scope="col">不限时流量包（起）</th>
              <th scope="col">价格状态</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, brand, entry, small, pack, top, status, statusDate }) => (
              <tr key={brand.id}>
                <td data-label="品牌">
                  <span className="mr-1 text-muted">{r.rank}.</span>
                  <Link
                    href={reviewPathForBrand(brand.id) ?? brandPath(brand)}
                    title={reviewPathForBrand(brand.id) ? `${brand.name}测评` : `${brand.name}资料页`}
                    className="text-ink hover:text-brand-strong"
                  >
                    {r.displayName}
                  </Link>
                </td>
                {/* 数字与单位之间用不换行空格（NBSP），窄屏卡片里不会拆成“¥109 /”和“年”两行 */}
                <td data-label="入门月付">{entry ? `${entry.plan} · ${entry.trafficGb}${NBSP}GB · ¥${entry.price}` : "待核实"}</td>
                <td data-label="每 GB（月付）">{entry?.perGb != null ? `¥${entry.perGb.toFixed(2)}` : "—"}</td>
                <td data-label="最大月流量档">{top ? `${top}${NBSP}GB${NBSP}/${NBSP}月` : "—"}</td>
                <td data-label="年付小包">
                  {small ? `${small.plan} · ${small.trafficGb}${NBSP}GB${NBSP}/${NBSP}月 · ¥${small.price}${NBSP}/${NBSP}年` : "资料未列"}
                </td>
                <td data-label="不限时流量包（起）">{pack ? `${pack.trafficGb}${NBSP}GB · ¥${pack.price}` : "资料未列"}</td>
                <td data-label="价格状态">
                  {/* 日期整体不换行，320px 卡片里不会拆成“11 月 9”和“日”两行 */}
                  {status === "verified" ? (
                    <span className="font-semibold text-success">
                      已核对 <span className="whitespace-nowrap">{statusDate ? formatDate(statusDate) : ""}</span>
                    </span>
                  ) : (
                    <span>
                      原稿参考价 · <span className="whitespace-nowrap">{statusDate ? formatDate(statusDate) : "日期待核实"}</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">
        长周期折扣、优惠码适用范围与设备限制各家不同：优惠码多数不适用年付小包（梯子云资料没有优惠码）；隐形人的不限时流量包限 1–3 台设备；微风网络、FLYV 写明所有设备共用一份流量；全球云的设备数有“不限”与“5 台”两种说法，待核实。详见各品牌页。
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/compare/" className="btn btn-secondary btn-sm">
          在套餐比较表中筛选全部套餐
          <ArrowRight size={14} aria-hidden="true" className="btn-arrow" />
        </Link>
        <Link href="/compare/budget-airport-plans-2026/" className="btn btn-secondary btn-sm">
          12 家机场低价套餐对比
          <ArrowRight size={14} aria-hidden="true" className="btn-arrow" />
        </Link>
      </div>
    </section>
  );
}
