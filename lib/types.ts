export type CategoryId = "recommend" | "reviews" | "compare" | "speedtest" | "guides" | "lingdongyun";

/** 品牌 id，取值见 data/brands.json */
export type BrandId = string;

export type EvidenceKind =
  /** 站长实测，附报告图或截图 */
  | "owner-measured"
  /** 站长提供的截图（第三方工具输出），由本站转录 */
  | "owner-screenshot"
  /** 资料提供方的文字记录，无截图 */
  | "text-record";

export interface ArticleSource {
  /** 资料名称，如“站主提供的灵动云品牌资料（灵动云.txt）” */
  label: string;
  /** 资料日期（YYYY-MM-DD） */
  date?: string;
  /** 可选说明 */
  note?: string;
  /** 可选链接（站内或外部） */
  url?: string;
}

export interface ArticleTestInfo {
  /** 测试时间（ISO 字符串，含时区） */
  testedAt: string;
  /** 测试网络环境，如“中国联通，城市未注明” */
  network: string;
  /** 测试工具 */
  tool: string;
  /** 测试方法概述 */
  method: string;
  /** 证据类型 */
  evidence: EvidenceKind;
  /** 局限性说明 */
  limitations?: string[];
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface ArticleFrontmatter {
  title: string;
  /** 可选：<title> 用的较短标题（H1 仍用 title） */
  seoTitle?: string;
  /** 可选：实质修改记录 */
  changes?: { date: string; note: string }[];
  slug: string;
  description: string;
  category: CategoryId;
  tags: string[];
  author: string;
  publishedAt: string;
  updatedAt: string;
  cover: string;
  coverAlt?: string;
  draft: boolean;
  featured: boolean;
  featuredOrder?: number;
  related: string[];
  /** 开头“核心摘要”要点（可选） */
  summaryPoints?: string[];
  /** 信息来源 */
  sources?: ArticleSource[];
  /** 测评方法说明 */
  methodology?: string;
  /** 推广披露文字（为空时按品牌字段自动生成） */
  disclosure?: string;
  /** 套餐信息核实日期 */
  plansVerifiedAt?: string;
  /** 文章关联的品牌（用于品牌推荐模块与披露） */
  brand?: BrandId;
  /** 涉及的节点地区（用于地区模块） */
  regions?: string[];
  /** 测试信息（测速 / 检测类文章） */
  test?: ArticleTestInfo;
  /** 文末常见问题：页面上可见，同时输出 FAQPage 结构化数据 */
  faq?: FaqItem[];
  /** 人为设置 noindex（极少使用） */
  noindex?: boolean;
}

export interface TocItem {
  id: string;
  text: string;
  depth: 2 | 3;
}

export interface Article {
  frontmatter: ArticleFrontmatter;
  /** MDX 正文（不含 frontmatter） */
  body: string;
  toc: TocItem[];
  /** 正文字数（去除标记后） */
  charCount: number;
  readingMinutes: number;
  /** 规范路径，如 /guides/clash-verge-rev-guide/ */
  path: string;
  /** 内容文件相对路径 */
  file: string;
}

/** 文章卡片所需的最小字段（可安全传给客户端组件） */
export interface ArticleSummary {
  title: string;
  slug: string;
  description: string;
  category: CategoryId;
  categoryLabel: string;
  path: string;
  cover: string;
  coverAlt: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  tags: string[];
}

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  path: `/${CategoryId}/`;
  /** 导航与卡片的简短说明 */
  short: string;
  /** 栏目页 H1 下方介绍 */
  intro: string;
  seoTitle: string;
  seoDescription: string;
  /** 栏目页自身文案（介绍、标题、描述）最近一次实质修改日期，参与 sitemap lastmod */
  copyUpdatedAt?: string;
}
