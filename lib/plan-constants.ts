/**
 * 套餐相关的常量与类型（不依赖 zod 与数据文件，客户端组件只从这里导入，
 * 避免把 data/*.json 与校验库打进浏览器端脚本）。
 */
import type { CycleKey } from "./schemas";

export type CycleId = CycleKey | "one-time";

export const CYCLE_LABELS: Record<CycleId, string> = {
  monthly: "月付",
  quarterly: "季付",
  "half-year": "半年付",
  yearly: "年付",
  "two-year": "两年付",
  "three-year": "三年付",
  "one-time": "一次性",
};

export type PlanKind = "periodic" | "yearly-small" | "data-pack" | "custom";

export type AudienceTag = "新手" | "轻度使用" | "日常使用" | "高流量" | "AI 工具" | "流媒体" | "多设备" | "预算有限" | "低频备用" | "跨境电商";

export const AUDIENCE_TAGS: AudienceTag[] = ["新手", "轻度使用", "日常使用", "高流量", "AI 工具", "流媒体", "多设备", "预算有限", "低频备用", "跨境电商"];

export interface PlanRow {
  id: string;
  brandId: string;
  brandName: string;
  brandPath: string;
  plan: string;
  kind: PlanKind;
  /** 周期套餐为每月流量；流量包为总流量；定制未写时为 null */
  trafficGb: number | null;
  trafficLabel: string;
  cycle: CycleId;
  cycleLabel: string;
  /** 该周期一次性支付的价格（元） */
  price: number;
  /** 折算到每月的价格（按资料价格计算；流量包为 null） */
  monthlyEquivalent: number | null;
  /** 每 GB 单价（按资料价格计算；流量包按总流量） */
  perGb: number | null;
  devices: string | null;
  audiences: AudienceTag[];
  status: "verified" | "reference";
  statusDate: string;
}
