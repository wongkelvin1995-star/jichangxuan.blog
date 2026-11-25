import type { CategoryId, CategoryMeta } from "./types";

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const SITE = {
  name: "机场优选",
  nameEn: "JichangXuan",
  domain: "jichangxuan.blog",
  url: (rawSiteUrl && rawSiteUrl.replace(/\/+$/, "")) || "https://jichangxuan.blog",
  /** 品牌口号（首页 H1 上方的小标题） */
  tagline: "选对机场，让连接更简单。",
  /**
   * 首页 SEO 信息：站长 2026-11-16 指定逐字文案；2026-11-25 首页推荐榜由 7 家调整为 12 家，
   * 按原句式把家数与品牌名改为 12 家版本（H1 不变）。
   */
  homeTitle: "2026机场推荐排行榜｜灵动云、暮光加速等12家机场套餐对比 - 机场优选",
  homeH1: "2026 机场推荐排行榜｜精选机场与套餐对比",
  homeDescription:
    "机场优选提供2026机场推荐与套餐对比指南，重点介绍灵动云、暮光加速、微风网络、飞猫云、大佬云、FLYV、浪网、隐形人、梯子云等12家机场，涵盖套餐价格、节点线路、AI工具与流媒体使用场景、客户端兼容及新手教程。",
  heroSubtitle:
    "精选灵动云、暮光加速、微风网络、飞猫云、大佬云、FLYV、浪网、隐形人、梯子云、无忧链接、Firefly 及全球云等 12 家热门机场，围绕套餐价格、节点线路、连接稳定性、设备兼容与使用需求展开介绍，帮助用户找到适合自己的网络加速服务。",
  description:
    "机场优选（JichangXuan）是简体中文的机场推荐与教程博客：整理首页推荐的 12 家热门机场的套餐、节点线路与客户端政策，提供套餐比较、节点测试记录和客户端教程。价格注明核实状态与日期，不编造评分；首页推荐榜是编辑推荐顺序，与上榜品牌的推广合作关系在披露页说明。",
  locale: "zh-CN",
  /** 本站建立日期（真实） */
  launchedAt: "2026-11-12",
  defaultOgImage: "/images/og/default.png",
  logoImage: "/images/og/logo-512.png",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null,
  bingVerification: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim() || null,
} as const;

/** 只有显式设为 preview 时才关闭索引；未设置即正式站 */
export const IS_PREVIEW = process.env.NEXT_PUBLIC_SITE_ENV === "preview";

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface AuthorMeta {
  id: string;
  name: string;
  /** 站内作者介绍锚点 */
  url: string;
  role: string;
  bio: string;
}

/**
 * 作者信息。目前只有“机场优选编辑部”一个署名；站长确定个人署名后在此补充，
 * 文章 frontmatter 的 author 字段填写对应 id。
 */
export const AUTHORS: Record<string, AuthorMeta> = {
  editorial: {
    id: "editorial",
    name: "机场优选编辑部",
    url: "/about/#author",
    role: "品牌资料整理、套餐核对、测试记录转录与教程编写",
    bio: "机场优选编辑部负责整理站长提供的品牌资料、核对套餐条款、转录站长的测试记录并编写客户端教程。节点测试由站长在自己的网络环境下完成，编辑部只转录报告中的数值并写明局限。本站与首页推荐榜及品牌资料库中的品牌存在推广合作，详见披露页。",
  },
};

export function getAuthor(id: string): AuthorMeta {
  return AUTHORS[id] ?? AUTHORS.editorial;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "recommend",
    label: "按需选机场",
    path: "/recommend/",
    short: "按 AI 工具、流媒体、多设备与预算挑选",
    intro:
      "按使用需求挑机场：AI 工具、流媒体、多设备共用、预算有限、想用 Clash 等第三方客户端、第一次使用。每个分组只依据品牌资料里写明的线路、设备与客户端政策给出候选，并链接到对应的品牌资料与教程；价格于 2026-11-25 由站长在品牌官网或用户后台核对，购买前以官网结算页为准。",
    seoTitle: "按需求选机场：AI 工具、流媒体、多设备与预算怎么选",
    seoDescription:
      "按 AI 工具、流媒体、多设备、预算与第三方客户端等需求挑选机场：每组列出资料支持的品牌、依据与限制，链接品牌资料页、套餐比较与教程，并附 2026 年选购方法。",
    copyUpdatedAt: "2026-11-25",
  },
  {
    id: "reviews",
    label: "机场测评",
    path: "/reviews/",
    short: "基于资料与测试记录的评价",
    intro:
      "12 家机场的独立测评：套餐价格（站长 2026-11-25 在官网或后台核对）、节点线路、客户端兼容性、AI 工具与流媒体资料逐家分析。灵动云的测评引用本站带日期的测试记录，其余品牌是资料分析型测评，不写测速数字；不打分，不编造用户评价，每篇写明本站与品牌的推广合作关系。",
    seoTitle: "2026机场测评：12家机场套餐、节点与客户端分析",
    seoDescription:
      "2026 机场测评专区：灵动云、暮光加速、微风网络、飞猫云、大佬云等 12 家机场的套餐价格、节点线路、客户端兼容性、AI 工具与流媒体资料分析，不打分、不编造用户好评。",
    copyUpdatedAt: "2026-11-25",
  },
  {
    id: "compare",
    label: "套餐比较",
    path: "/compare/",
    short: "价格、流量、周期一目了然",
    intro:
      "套餐比较栏目把价格、流量、周期、设备数与适合人群放在同一张表里，可以按条件筛选。价格于 2026-11-25 由站长在品牌官网或用户后台核对，购买前以官网结算页为准。资料没写的字段显示“待核实”，不会用估算数填充。表中品牌均与本站存在推广合作。",
    seoTitle: "机场套餐比较表：按价格、流量、周期与设备数筛选",
    seoDescription:
      "按价格、流量、周期、设备数与适合人群筛选 20 个机场品牌的套餐：价格于 2026-11-25 由站长在官网或后台核对，注明核对日期；另有低价套餐对比、流量倍率等解读文章。",
    copyUpdatedAt: "2026-11-25",
  },
  {
    id: "speedtest",
    label: "节点实测",
    path: "/speedtest/",
    short: "测试记录与节点知识",
    intro:
      "节点实测栏目收录本站掌握的测速与连通性测试（目前只有灵动云），每份报告都注明测试日期、出口节点、工具、方法与局限，本地网络环境写到资料能提供的程度（缺的项标“未注明”）；也收录节点地区、IEPL 与 IPLC 线路、AI 工具节点选择、晚高峰自测等节点知识文章。没有测试数据的品牌与地区不显示任何估算结果。",
    seoTitle: "节点实测与节点知识：测速记录、线路类型与节点选择",
    seoDescription:
      "机场节点测速与解锁检测记录（注明日期、出口节点与工具），以及节点地区选择、IEPL 与 IPLC 线路区别、AI 工具节点、晚高峰稳定性自测等节点知识。",
    copyUpdatedAt: "2026-11-24",
  },
  {
    id: "guides",
    label: "使用教程",
    path: "/guides/",
    short: "客户端、Clash 订阅与多设备",
    intro:
      "使用教程覆盖 Windows、Android、iOS 客户端的安装与配置、Clash Verge Rev 的使用、TUN 模式与系统代理的区别、DNS 与连接故障排查，以及 Clash Meta 订阅兼容、多设备共用和流媒体网速等使用指南。",
    seoTitle: "机场使用教程：客户端配置、Clash 订阅与故障排查",
    seoDescription:
      "Windows、Android、iOS 机场客户端配置教程，Clash Verge Rev 与 Clash Meta 订阅兼容，TUN 与系统代理，多设备共用与流媒体网速需求，以及 DNS 与连接故障排查。",
    copyUpdatedAt: "2026-11-16",
  },
  {
    id: "lingdongyun",
    label: "灵动云专区",
    path: "/lingdongyun/",
    short: "品牌介绍、套餐与教程",
    intro:
      "灵动云专区集中整理灵动云的品牌介绍、套餐与优惠码、客户端教程、节点线路与测试记录，以及常见连接问题。本站与灵动云存在推广合作，详见披露页。",
    seoTitle: "灵动云机场怎么样：2026 套餐价格、节点与使用指南",
    seoDescription:
      "灵动云机场 2026 套餐价格（2026-11-25 已核对）、优惠码、节点线路、官方客户端与订阅申请、有日期的测试记录和常见问题；本站与灵动云存在推广合作。",
    copyUpdatedAt: "2026-11-25",
  },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as CategoryId[];

export function getCategory(id: string): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function isCategoryId(id: string): id is CategoryId {
  return CATEGORY_IDS.includes(id as CategoryId);
}

export interface NavItem {
  label: string;
  href: string;
}

export const NAV: NavItem[] = [
  { label: "首页", href: "/" },
  { label: "按需选机场", href: "/recommend/" },
  { label: "机场测评", href: "/reviews/" },
  { label: "套餐比较", href: "/compare/" },
  { label: "节点实测", href: "/speedtest/" },
  { label: "使用教程", href: "/guides/" },
  { label: "灵动云专区", href: "/lingdongyun/" },
  { label: "关于", href: "/about/" },
];

/**
 * 静态页面登记：path → 页面文案最近一次实质修改日期。
 * 供 sitemap lastmod 使用；只在内容实质变更时手动更新，不随构建改动。
 */
/**
 * 不依赖文章与品牌数据的静态页面：path → 页面文案最近一次实质修改日期。
 * 供 sitemap lastmod 使用；只在内容实质变更时手动更新，不随构建改动。
 * 首页、/articles/、/brands/、/disclosure/ 的 lastmod 由 app/sitemap.ts 按实际依赖的数据计算，这里的日期是下限。
 */
export const STATIC_PAGES: { path: string; lastmod: string; priority: number }[] = [
  { path: "/", lastmod: "2026-11-24", priority: 1 },
  { path: "/articles/", lastmod: "2026-11-12", priority: 0.6 },
  { path: "/brands/", lastmod: "2026-11-25", priority: 0.7 },
  { path: "/about/", lastmod: "2026-11-25", priority: 0.4 },
  { path: "/methodology/", lastmod: "2026-11-25", priority: 0.5 },
  { path: "/disclosure/", lastmod: "2026-11-25", priority: 0.4 },
  { path: "/updates/", lastmod: "2026-11-16", priority: 0.3 },
  { path: "/contact/", lastmod: "2026-11-25", priority: 0.3 },
  { path: "/privacy/", lastmod: "2026-11-25", priority: 0.2 },
];

/** 首页“机场客户端与订阅使用教程”模块的入口（指向真实文章，label 即链接文字） */
export const TUTORIAL_ENTRIES: { label: string; sub: string; slug: string; icon: "windows" | "android" | "ios" | "clash" | "tun" | "dns" }[] = [
  { label: "Windows 客户端教程", sub: "安装客户端、导入订阅、系统代理", slug: "windows-client-setup", icon: "windows" },
  { label: "Android 客户端教程", sub: "Clash Meta for Android 与官方客户端", slug: "android-client-setup", icon: "android" },
  { label: "iOS 客户端教程", sub: "App Store 区域、Shadowrocket 与 VPN 配置", slug: "ios-client-setup", icon: "ios" },
  { label: "Clash Verge Rev 使用教程", sub: "导入订阅、规则模式与常见设置", slug: "clash-verge-rev-guide", icon: "clash" },
  { label: "TUN 模式与系统代理的区别", sub: "两种模式怎么选", slug: "tun-vs-system-proxy", icon: "tun" },
  { label: "DNS 与连接故障排查", sub: "连上却打不开网页时怎么排查", slug: "dns-and-connection-troubleshooting", icon: "dns" },
];

export const ARTICLES_PER_PAGE = 9;
