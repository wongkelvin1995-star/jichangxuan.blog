import plansJson from "@/data/plans.json";

import { BRANDS, brandPath, getBrand } from "./brands";
import { CYCLE_LABELS, type AudienceTag, type PlanKind, type PlanRow } from "./plan-constants";
import { brandPlansSchema, type BrandPlans, type CycleKey } from "./schemas";

export type { BrandPlans, CycleKey } from "./schemas";

/**
 * 套餐数据：data/plans.json 只录入资料明确写出的数字；每 GB 单价与月均价格由本文件按价格和周期计算
 * （页面标注“按资料价格计算”），不是品牌公布的数据。
 */
const parsed = brandPlansSchema.array().safeParse(plansJson);
if (!parsed.success) {
  throw new Error(`data/plans.json 不合法：${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("；")}`);
}
export const ALL_BRAND_PLANS: BrandPlans[] = parsed.data;

export { AUDIENCE_TAGS, CYCLE_LABELS } from "./plan-constants";
export type { AudienceTag, CycleId, PlanKind, PlanRow } from "./plan-constants";

export const CYCLE_MONTHS: Record<CycleKey, number> = {
  monthly: 1,
  quarterly: 3,
  "half-year": 6,
  yearly: 12,
  "two-year": 24,
  "three-year": 36,
};

export const CYCLE_ORDER: CycleKey[] = ["monthly", "quarterly", "half-year", "yearly", "two-year", "three-year"];

/**
 * 适合人群为编辑建议，按套餐类型与流量档位统一归类（不是品牌数据）：
 *  周期套餐 ≤100 GB：新手 / 轻度使用 / 预算有限；101–200：新手 / 轻度使用 / AI 工具；
 *  201–400：日常使用 / AI 工具 / 流媒体 / 多设备；401–800：高流量 / 流媒体 / 多设备；>800：高流量 / 多设备。
 *  年付小包：轻度使用 / 预算有限 / 新手。流量包：低频备用（按总量再加轻度 / 日常 / 高流量）。定制：跨境电商 / 高流量。
 */
export function audiencesFor(kind: PlanKind, trafficGb: number | null): AudienceTag[] {
  if (kind === "custom") return ["跨境电商", "高流量"];
  if (kind === "yearly-small") return ["轻度使用", "预算有限", "新手"];
  if (kind === "data-pack") {
    if (trafficGb === null) return ["低频备用"];
    if (trafficGb <= 150) return ["低频备用", "轻度使用"];
    if (trafficGb <= 500) return ["低频备用", "日常使用"];
    return ["低频备用", "高流量"];
  }
  if (trafficGb === null) return [];
  if (trafficGb <= 100) return ["新手", "轻度使用", "预算有限"];
  if (trafficGb <= 200) return ["新手", "轻度使用", "AI 工具"];
  if (trafficGb <= 400) return ["日常使用", "AI 工具", "流媒体", "多设备"];
  if (trafficGb <= 800) return ["高流量", "流媒体", "多设备"];
  return ["高流量", "多设备"];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildRows(p: BrandPlans): PlanRow[] {
  const brand = getBrand(p.brandId);
  if (!brand || !brand.published) return [];
  const base = {
    brandId: brand.id,
    brandName: brand.name,
    brandPath: brandPath(brand),
    status: p.priceStatus,
    statusDate: p.priceStatus === "verified" && p.verifiedAt ? p.verifiedAt : p.materialDate,
  } as const;
  const rows: PlanRow[] = [];
  p.periodic.forEach((tier, ti) => {
    for (const cycle of CYCLE_ORDER) {
      const price = tier.prices[cycle];
      if (price === undefined) continue;
      const monthly = round2(price / CYCLE_MONTHS[cycle]);
      rows.push({
        ...base,
        id: `${brand.id}-p${ti}-${cycle}`,
        plan: tier.plan,
        kind: "periodic",
        trafficGb: tier.trafficGb,
        trafficLabel: `${tier.trafficGb} GB / 月`,
        cycle,
        cycleLabel: CYCLE_LABELS[cycle],
        price,
        monthlyEquivalent: monthly,
        perGb: round2(monthly / tier.trafficGb),
        devices: p.devices,
        audiences: audiencesFor("periodic", tier.trafficGb),
      });
    }
  });
  p.yearlySmall.forEach((s, i) => {
    const monthly = round2(s.price / 12);
    rows.push({
      ...base,
      id: `${brand.id}-ys${i}`,
      plan: s.plan,
      kind: "yearly-small",
      trafficGb: s.trafficGb,
      trafficLabel: `${s.trafficGb} GB / 月（年付小包）`,
      cycle: "yearly",
      cycleLabel: CYCLE_LABELS.yearly,
      price: s.price,
      monthlyEquivalent: monthly,
      perGb: round2(monthly / s.trafficGb),
      devices: null, // 资料只对周期套餐写了设备规则，年付小包未写
      audiences: audiencesFor("yearly-small", s.trafficGb),
    });
  });
  p.dataPacks.forEach((d, i) => {
    rows.push({
      ...base,
      id: `${brand.id}-dp${i}`,
      plan: d.plan,
      kind: "data-pack",
      trafficGb: d.trafficGb,
      trafficLabel: `${d.trafficGb} GB（不限时）`,
      cycle: "one-time",
      cycleLabel: CYCLE_LABELS["one-time"],
      price: d.price,
      monthlyEquivalent: null,
      perGb: round2(d.price / d.trafficGb),
      devices: d.devices ?? null, // 只用流量包自己写明的设备数，不继承周期套餐的规则
      audiences: audiencesFor("data-pack", d.trafficGb),
    });
  });
  p.custom.forEach((c, i) => {
    const months = CYCLE_MONTHS[c.cycle];
    const monthly = round2(c.price / months);
    rows.push({
      ...base,
      id: `${brand.id}-c${i}`,
      plan: c.plan,
      kind: "custom",
      trafficGb: c.trafficGb,
      trafficLabel: c.trafficGb ? `${c.trafficGb} GB / 月` : "按需定制",
      cycle: c.cycle,
      cycleLabel: CYCLE_LABELS[c.cycle],
      price: c.price,
      monthlyEquivalent: monthly,
      perGb: c.trafficGb ? round2(monthly / c.trafficGb) : null,
      devices: null, // 定制线路的设备规则资料未写
      audiences: audiencesFor("custom", c.trafficGb),
    });
  });
  return rows;
}

/** 全部已发布品牌的套餐行，按品牌精选顺序 */
export const PLAN_ROWS: PlanRow[] = BRANDS.filter((b) => b.published)
  .sort((a, b) => a.featuredOrder - b.featuredOrder)
  .flatMap((b) => {
    const p = ALL_BRAND_PLANS.find((x) => x.brandId === b.id);
    return p ? buildRows(p) : [];
  });

export function getBrandPlans(brandId: string): BrandPlans | undefined {
  return ALL_BRAND_PLANS.find((p) => p.brandId === brandId);
}

export function getPlanRowsByBrand(brandId: string): PlanRow[] {
  return PLAN_ROWS.filter((r) => r.brandId === brandId);
}

/** 首页精简版：每个品牌的入门档月付与年付（有则列），加年付小包 */
export function getHomePlanRows(): PlanRow[] {
  const out: PlanRow[] = [];
  for (const b of BRANDS.filter((x) => x.published).sort((a, c) => a.featuredOrder - c.featuredOrder)) {
    const rows = getPlanRowsByBrand(b.id);
    const periodic = rows.filter((r) => r.kind === "periodic");
    if (periodic.length) {
      const minTraffic = Math.min(...periodic.map((r) => r.trafficGb ?? Infinity));
      const entry = periodic.filter((r) => r.trafficGb === minTraffic);
      const monthly = entry.find((r) => r.cycle === "monthly");
      const yearly = entry.find((r) => r.cycle === "yearly");
      if (monthly) out.push(monthly);
      if (yearly) out.push(yearly);
    }
    const small = rows.find((r) => r.kind === "yearly-small");
    if (small) out.push(small);
  }
  return out;
}

export interface EntryPlan {
  plan: string;
  trafficLabel: string;
  price: number;
  cycleLabel: string;
  status: "verified" | "reference";
  statusDate: string;
}

/** 入门套餐：流量最小的周期套餐的月付价（没有月付时取最短周期） */
export function getEntryPlan(brandId: string): EntryPlan | null {
  const periodic = getPlanRowsByBrand(brandId).filter((r) => r.kind === "periodic");
  if (!periodic.length) return null;
  const minTraffic = Math.min(...periodic.map((r) => r.trafficGb ?? Infinity));
  const entry = periodic.filter((r) => r.trafficGb === minTraffic);
  const pick = entry.find((r) => r.cycle === "monthly") ?? entry[0];
  return { plan: pick.plan, trafficLabel: pick.trafficLabel, price: pick.price, cycleLabel: pick.cycleLabel, status: pick.status, statusDate: pick.statusDate };
}
