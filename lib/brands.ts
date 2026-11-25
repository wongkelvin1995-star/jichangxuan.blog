import brandsJson from "@/data/brands.json";

import { brandSchema, type Brand } from "./schemas";

export type { Brand } from "./schemas";

/**
 * 品牌与推广链接统一配置：数据在 data/brands.json，本文件只负责校验与读取。
 *
 * 规则：
 *  - 推广 / 官网地址只在 data/brands.json 维护，组件不得自行拼接或猜测地址；地址来自站主提供的资料。
 *  - 外链一律 rel="sponsored nofollow noopener noreferrer"（推广）或 rel="nofollow noopener noreferrer"（非推广）。
 *  - dataStatus：verified = 价格已核对（站长在品牌官网或用户后台逐项核对价格，显示核对日期；节点、客户端等其他资料仍是品牌资料说法）；
 *    reference = 原稿参考价（站主资料，价格尚未在官网或后台核对）；pending = 不展示价格。2026-11-25 起 20 个品牌均为 verified。
 *  - published 为 false 的品牌不生成页面、不进入列表、比较表与 sitemap。
 */
const parsed = brandSchema.array().safeParse(brandsJson);
if (!parsed.success) {
  throw new Error(`data/brands.json 不合法：${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("；")}`);
}

export const BRANDS: Brand[] = parsed.data;

export function getBrand(id: string): Brand | undefined {
  return BRANDS.find((b) => b.id === id);
}

export function getBrandBySlug(slug: string): Brand | undefined {
  return BRANDS.find((b) => b.slug === slug && b.published);
}

/** 已发布品牌，按精选顺序（管理员在 data/brands.json 的 featuredOrder 设置） */
export function getPublishedBrands(): Brand[] {
  return BRANDS.filter((b) => b.published).sort((a, b) => a.featuredOrder - b.featuredOrder || a.name.localeCompare(b.name, "zh-CN"));
}

export function getFeaturedBrands(limit = 3): Brand[] {
  return getPublishedBrands().slice(0, limit);
}

/** 站内详情路径：有专题的品牌指向专题，其余指向品牌资料页 */
export function brandPath(brand: Brand): string {
  return brand.hubPath ?? `/brands/${brand.slug}/`;
}

export const LINGDONGYUN: Brand = getBrand("lingdongyun")!;

/**
 * 推广按钮写“官网”还是“注册入口”：资料核验里写明官网域名待核实的品牌（如梯子云），
 * 本站只有站长提供的注册入口，不能把它称作官网。
 */
export function brandEntryWord(brand: Brand): "官网" | "注册入口" {
  return brand.verificationNotes.some((n) => n.field === "官网域名" && n.status === "待核实") ? "注册入口" : "官网";
}

/** “X官网注册” / “X注册入口” */
export function brandRegisterLabel(brand: Brand): string {
  return brandEntryWord(brand) === "官网" ? `${brand.name}官网注册` : `${brand.name}注册入口`;
}

/** “东南亚”“欧美”这类区域统称不是具体地区，不能计入地区数 */
const REGION_GROUP = /^(东南亚|欧美|欧洲|美洲|亚太|亚洲|中东|非洲|大洋洲|其他|其它)$/;

/** 资料列出的地区：具体地区与区域统称分开，数地区时只数具体地区 */
export function listedRegions(brand: Brand): { concrete: string[]; groups: string[] } {
  return {
    concrete: brand.regions.filter((r) => !REGION_GROUP.test(r)),
    groups: brand.regions.filter((r) => REGION_GROUP.test(r)),
  };
}

/** 外链 rel 值 */
export function brandLinkRel(brand: Brand): string {
  return brand.relationship === "sponsored" ? "sponsored nofollow noopener noreferrer" : "nofollow noopener noreferrer";
}

export type DataStatusLabel = { label: string; kind: "verified" | "reference" | "pending"; description: string };

export function dataStatusLabel(brand: Brand): DataStatusLabel {
  if (brand.dataStatus === "verified") {
    return { label: "价格已核对", kind: "verified", description: `价格于 ${brand.verifiedAt ?? brand.materialDate} 由站长在品牌官网或用户后台核对` };
  }
  if (brand.dataStatus === "reference") {
    return {
      label: "原稿参考价",
      kind: "reference",
      description: `价格来自站长提供的品牌资料原稿（资料日期 ${brand.materialDate}），尚未在品牌后台逐项核实，以官网结算页为准`,
    };
  }
  return { label: "待核实", kind: "pending", description: "资料尚未核实，不展示价格" };
}

/** 品牌推广披露的统一文案（简短：先说合作关系，再说价格状态） */
export function brandDisclosureText(brand: Brand): string {
  const priceNote =
    brand.dataStatus === "verified"
      ? `价格于 ${brand.verifiedAt ?? brand.materialDate} 由站长在品牌官网或用户后台核对，价格可能变动，购买前以官网结算页为准。`
      : brand.dataStatus === "reference"
        ? `价格为站长提供的品牌资料原稿参考价（资料日期 ${brand.materialDate}），尚未在品牌后台核实，以官网结算页为准。`
        : "套餐信息尚未核实，核实前不展示价格。";
  if (brand.relationship === "sponsored") {
    return `推广链接：机场优选与${brand.name}存在推广合作，通过本站链接注册或购买，本站可能获得佣金，你支付的价格不变。${priceNote}`;
  }
  return `机场优选目前与${brand.name}没有推广合作，不提供购买链接。${priceNote}`;
}
