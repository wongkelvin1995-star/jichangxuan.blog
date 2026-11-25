/**
 * 首页“2026 热门机场推荐排行榜”的固定顺序（站长 2026-11-16 指定七家；2026-11-25 调整为 12 家并改顺序）。
 *
 * - 这是编辑推荐顺序，包含推广合作因素，不是测速、性能或评分排名。
 * - 顺序必须严格保持一致：不得自动排序、按数据重排或随机切换。
 * - data/brands.json 中上榜品牌的 featuredOrder 必须依次为 1–N（scripts/validate-content.ts 检查），
 *   这样品牌资料库、披露页等按 featuredOrder 排序的列表与首页榜单一致。
 * - 这里不放任何价格、流量等数据；数据统一从 data/brands.json、data/plans.json 读取。
 * - 改动榜单时同步修改：lib/site.ts 的首页 Title / Description / 副标题、scripts/site-check.mjs 的 HOME_EXPECT、
 *   首页与栏目页里写明家数的文字，并在 data/changelog.json 记录。
 */
export interface RankingEntry {
  rank: number;
  brandId: string;
  /** 首页 H3 文字（与站主指令逐字一致） */
  heading: string;
  /** 卡片与表格中展示的品牌名（含站主指定的英文名） */
  displayName: string;
}

export const HOME_RANKING: readonly RankingEntry[] = [
  { rank: 1, brandId: "lingdongyun", heading: "第一名 灵动云", displayName: "灵动云" },
  { rank: 2, brandId: "muguang-jiasu", heading: "第二名 暮光加速", displayName: "暮光加速" },
  { rank: 3, brandId: "weifeng-wangluo", heading: "第三名 微风网络", displayName: "微风网络 Breezenet" },
  { rank: 4, brandId: "feimaoyun", heading: "第四名 飞猫云", displayName: "飞猫云" },
  { rank: 5, brandId: "dalaoyun", heading: "第五名 大佬云", displayName: "大佬云 DalaoYun" },
  { rank: 6, brandId: "flyv", heading: "第六名 FLYV 飞V", displayName: "FLYV 飞V" },
  { rank: 7, brandId: "langwang", heading: "第七名 浪网 WaveNet", displayName: "浪网 WaveNet" },
  { rank: 8, brandId: "yinxingren", heading: "第八名 隐形人", displayName: "隐形人" },
  { rank: 9, brandId: "tiziyun", heading: "第九名 梯子云", displayName: "梯子云 LadderCloud" },
  { rank: 10, brandId: "wuyou", heading: "第十名 无忧链接", displayName: "无忧链接" },
  { rank: 11, brandId: "firefly", heading: "第十一名 Firefly", displayName: "Firefly" },
  { rank: 12, brandId: "quanqiuyun", heading: "第十二名 全球云", displayName: "全球云" },
];

/** 榜单顺序最近一次调整日期 */
export const RANKING_UPDATED_AT = "2026-11-25";

export const RANKING_TITLE = "2026 热门机场推荐排行榜";

/** 榜单标题下方的固定披露（同时用于 ItemList 的 description） */
export const RANKING_DISCLOSURE =
  "本榜是机场优选的编辑推荐顺序，包含推广合作因素，不是测速或评分排名。上榜 12 家均与本站存在推广合作：通过本站链接注册或购买，本站可能获得佣金，你支付的价格不变。";

export function rankOf(brandId: string): number | undefined {
  return HOME_RANKING.find((r) => r.brandId === brandId)?.rank;
}
