import Link from "next/link";

import { PlanCompare } from "@/components/compare/PlanCompare";
import { getPublishedBrands } from "@/lib/brands";
import { PLAN_ROWS, getHomePlanRows } from "@/lib/plans";
import { getOrderedReviews } from "@/lib/reviews";

/**
 * /compare/ 第 1 页顶部的套餐筛选表。
 * 只由 app/compare/page.tsx 导入：PlanCompare 是客户端组件，放在共用的 CategoryListing 里会让
 * 其他栏目和所有文章页都加载它的脚本。
 */
export function CompareExtras() {
  const initial = getHomePlanRows();
  return (
    <section className="mb-14" aria-labelledby="compare-tool-title">
      <h2 id="compare-tool-title" className="section-title">
        机场套餐筛选表
      </h2>
      <p className="section-desc">
        共收录 {PLAN_ROWS.length} 条套餐，页面先列出各品牌的入门档与年付小包（{initial.length} 条），点“显示全部”或使用筛选后加载其余套餐；每个品牌的完整套餐也在对应品牌页。月均价格与每 GB 单价由本站按标价计算；价格于 2026-11-25 由站长在各品牌官网或用户后台核对，购买前以官网结算页为准。表中品牌均与本站存在推广合作。看不懂流量、周期、倍率这些字段时，先读
        <Link href="/compare/how-to-read-airport-plans/" className="mx-0.5 text-brand-strong underline underline-offset-2">
          看懂机场套餐
        </Link>
        。
      </p>
      <div className="mt-6">
        <PlanCompare rows={initial} fullRowsUrl="/plans.json" fullCount={PLAN_ROWS.length} brandOptions={getPublishedBrands().map((b) => ({ id: b.id, name: b.name }))}
          reviewPaths={Object.fromEntries(getOrderedReviews().filter((r) => r.brand).map((r) => [r.brand as string, r.path]))}
        />
      </div>
    </section>
  );
}
