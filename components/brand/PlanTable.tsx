import { StatusBadge } from "@/components/ui/Badge";
import { getBrand } from "@/lib/brands";
import { formatDate } from "@/lib/format";
import { CYCLE_LABELS, CYCLE_MONTHS, CYCLE_ORDER, getBrandPlans, type CycleKey } from "@/lib/plans";

function money(v: number): string {
  return `¥${Number.isInteger(v) ? v : v.toFixed(2).replace(/0$/, "")}`;
}

/**
 * 品牌套餐表：周期套餐（只显示资料提供了价格的周期列）、年付小包、不限时流量包、定制线路与流量规则。
 * 价格状态写在表格上方：已核对的显示核对日期；原稿参考价的显示资料日期并注明未在品牌后台核实。
 */
export function PlanTable({ brand: brandId = "lingdongyun" }: { brand?: string }) {
  const brand = getBrand(brandId);
  const plans = getBrandPlans(brandId);
  if (!brand) return null;
  if (!plans || brand.dataStatus === "pending") {
    return (
      <div className="not-prose my-6 rounded-xl border border-warning/30 bg-warning-bg/60 p-4 text-sm">
        <p className="font-semibold text-ink">{brand.name} 套餐信息待核实</p>
        <p className="mt-1 text-ink-soft">核实后才会展示价格、流量与设备数，不使用估算数据填充。</p>
      </div>
    );
  }

  const verified = plans.priceStatus === "verified";
  const cycles = CYCLE_ORDER.filter((c) => plans.periodic.some((t) => t.prices[c] !== undefined));
  const statusLine = verified
    ? `价格已于 ${formatDate(plans.verifiedAt ?? plans.materialDate)} 由站长在品牌官网或用户后台逐项核对；价格与优惠可能变动，购买前以官网结算页为准。`
    : `原稿参考价：来自站长提供的品牌资料（资料日期 ${formatDate(plans.materialDate)}），尚未在品牌后台核实，购买前以官网结算页为准。`;

  return (
    <div className="not-prose my-6 space-y-6">
      <p className={`flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3 text-sm ${verified ? "border-success/30 bg-success-bg/50" : "border-brand/25 bg-sky-soft/70"} text-ink-soft`}>
        <StatusBadge kind={verified ? "verified" : "reference"} label={verified ? "价格已核对" : "原稿参考价"} />
        <span>{statusLine}</span>
      </p>

      {plans.periodic.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-ink">
            {brand.name}周期套餐（{plans.periodic.length} 档）
          </h3>
          <div className="table-wrap mt-3">
            <table>
              <caption className="sr-only">
                {brand.name}周期套餐价格表（{verified ? "已核对" : "原稿参考价"}）
              </caption>
              <thead>
                <tr>
                  <th scope="col">套餐</th>
                  <th scope="col">每月流量</th>
                  {cycles.map((c) => (
                    <th key={c} scope="col">
                      {CYCLE_LABELS[c]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plans.periodic.map((t) => (
                  <tr key={t.plan}>
                    <td>
                      {t.plan}
                      {t.notes?.length ? <span className="block text-xs font-normal text-muted">{t.notes.join("；")}</span> : null}
                    </td>
                    <td className="whitespace-nowrap">{t.trafficGb} GB</td>
                    {cycles.map((c: CycleKey) => (
                      <td key={c} className="whitespace-nowrap tabular-nums">
                        {t.prices[c] !== undefined ? money(t.prices[c]!) : <span className="text-muted">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {plans.cycleDiscounts && <p className="mt-2 text-xs text-muted">长周期折扣：{plans.cycleDiscounts}。“—”表示资料未写该周期。</p>}
        </div>
      )}

      {(plans.yearlySmall.length > 0 || plans.custom.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.yearlySmall.length > 0 && (
            <div className="rounded-xl border border-line bg-white p-4">
              <h3 className="text-base font-bold text-ink">年付小包</h3>
              <ul className="mt-1 space-y-2">
                {plans.yearlySmall.map((s) => (
                  <li key={s.plan} className="text-sm text-ink-soft">
                    {s.plan}：{s.trafficGb} GB / 月，<strong className="text-ink">{money(s.price)} / 年</strong>
                    <span className="text-muted">（月均约 {money(Math.round((s.price / 12) * 100) / 100)}）</span>
                    {s.notes?.length ? (
                      <ul className="mt-1 list-disc pl-5 text-xs text-muted">
                        {s.notes.map((n) => (
                          <li key={n}>{n}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {plans.custom.length > 0 && (
            <div className="rounded-xl border border-line bg-white p-4">
              <h3 className="text-base font-bold text-ink">独享 / 定制线路</h3>
              <ul className="mt-1 space-y-2">
                {plans.custom.map((c) => (
                  <li key={c.plan} className="text-sm text-ink-soft">
                    {c.plan}：{c.trafficGb ? `${c.trafficGb} GB / 月` : "流量按需（资料未写）"}，
                    <strong className="text-ink">
                      {money(c.price)} / {CYCLE_LABELS[c.cycle]}
                    </strong>
                    {CYCLE_MONTHS[c.cycle] > 1 && <span className="text-muted">（月均约 {money(Math.round((c.price / CYCLE_MONTHS[c.cycle]) * 100) / 100)}）</span>}
                    {c.notes?.length ? (
                      <ul className="mt-1 list-disc pl-5 text-xs text-muted">
                        {c.notes.map((n) => (
                          <li key={n}>{n}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {plans.dataPacks.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-ink">{brand.name}不限时流量包（流量不过期，用完为止）</h3>
          <div className="table-wrap mt-3">
            <table>
              <caption className="sr-only">
                {brand.name}不限时流量包价格表（{verified ? "已核对" : "原稿参考价"}）
              </caption>
              <thead>
                <tr>
                  <th scope="col">流量包</th>
                  <th scope="col">总流量</th>
                  <th scope="col">价格</th>
                  <th scope="col">每 GB（本站计算）</th>
                  <th scope="col">说明</th>
                </tr>
              </thead>
              <tbody>
                {plans.dataPacks.map((p) => (
                  <tr key={p.plan}>
                    <td>{p.plan}</td>
                    <td className="whitespace-nowrap">{p.trafficGb} GB</td>
                    <td className="whitespace-nowrap tabular-nums">{money(p.price)}</td>
                    <td className="whitespace-nowrap tabular-nums">约 ¥{(p.price / p.trafficGb).toFixed(2)}</td>
                    <td className="text-xs text-muted">{[p.devices, ...(p.notes ?? [])].filter(Boolean).join("；") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-line-soft bg-bg p-4 text-sm text-ink-soft">
        <p className="font-semibold text-ink">流量规则与优惠（资料原文整理）</p>
        <ul className="mt-1 list-disc pl-5">
          {plans.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
          {plans.devices && <li>设备数：{plans.devices}</li>}
        </ul>
        <p className="mt-3 text-xs text-muted">
          以上{verified ? "价格已核对" : "为原稿参考价"}。每 GB 单价与月均价格由机场优选按资料价格计算，不是品牌公布的数据。
        </p>
      </div>
    </div>
  );
}
