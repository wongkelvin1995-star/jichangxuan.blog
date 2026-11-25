# 机场优选 jichangxuan.blog

> 2026 机场推荐排行榜｜精选机场与套餐对比

简体中文机场推荐与教程博客（英文名 JichangXuan）：首页 2026 推荐排行榜（2026-11-25 起 12 家）、上榜品牌的独立介绍页、套餐比较、节点测试记录与客户端教程。Next.js App Router + MDX，全站静态生成，可部署到 Node 服务器、Vercel 或 Cloudflare Pages（静态导出）。

## 技术栈

- Next.js 16（App Router，Turbopack）、React 19、TypeScript 5
- Tailwind CSS 4（设计令牌在 `app/globals.css` 的 `@theme`）
- MDX：`next-mdx-remote/rsc` 在服务端编译，正文完整输出到 HTML
- `gray-matter` + `zod` 校验 frontmatter；`github-slugger` / `rehype-slug` 生成目录锚点
- `lucide-react` 图标；动画全部为 CSS，遵守 `prefers-reduced-motion`

## 命令

```bash
npm install          # 安装依赖（Node ≥ 20.9）
npm run dev          # 开发服务器（草稿可通过地址预览，带 noindex）
npm run validate     # 内容校验：frontmatter、日期、slug、related、正文内链、品牌正文、首页推荐榜顺序、更新记录、禁用字样
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run build        # prebuild（validate + IndexNow 密钥文件 + _redirects）→ next build
npm start            # 以 Node 服务器运行构建结果
npm run og           # 生成封面 SVG、OG PNG、logo 与证据图 webp（改了封面或证据图后运行）
npm run check:site   # 对运行中的站点做全站检查（默认 http://localhost:3000，可传其他地址）
npm run check:lighthouse -- http://localhost:3000   # Lighthouse 批量测试（移动 / 桌面各 3 次取中位数，写入 reports/）
npm run indexnow:dry # IndexNow 干运行：列出将提交的 URL，不发送
npm run indexnow     # IndexNow 真实提交（需 INDEXNOW_KEY，且线上密钥文件已可访问）
```

静态导出（Cloudflare Pages 等）：

```bash
$env:STATIC_EXPORT="1"; npm run build   # 输出到 out/（Cloudflare Pages 自带 CF_PAGES 变量，无需手动设置）
```

## 目录

| 路径 | 用途 |
| --- | --- |
| `app/` | 路由：首页、`[category]/`（栏目列表）、`[category]/[...rest]/`（文章与分页）、`lingdongyun/`（灵动云专区）、`compare/`（套餐比较栏目首页，只有这里加载筛选组件脚本）、`brands/`（品牌资料库与品牌页）、`articles/[[...page]]/`、`tags/`、`search/`、关于类页面、`updates/`（更新记录）、`sitemap.ts`、`robots.ts`、`rss.xml`、`search-index.json`、`plans.json` |
| `components/` | layout（页头、页脚、面包屑）、home（首页九个模块）、article（文章布局、卡片、目录、分页）、brand（品牌页模块、套餐表、资料来源与更新记录、购买按钮）、category（栏目页、按需选机场）、compare（PlanCompare 筛选）、search、ui |
| `content/<category>/<slug>.mdx` | 文章；目录名必须等于 frontmatter `category`，文件名必须等于 `slug` |
| `content/brands/<品牌 slug>.mdx` | 品牌页编辑正文（首页推荐榜上的品牌都要有，`site-check` 检查 ≥ 1200 个汉字）；渲染在 `/brands/<slug>/`，灵动云渲染在 `/lingdongyun/` |
| `lib/site.ts` | 站点常量（含首页 Title / H1 / Description / 副标题）、导航、栏目、作者、静态页面登记 |
| `lib/ranking.ts` | **首页推荐榜固定顺序**（站长指定，编辑推荐、含推广合作因素；2026-11-25 起 12 家）；`data/brands.json` 上榜品牌的 `featuredOrder` 必须依次为 1–12。改榜单时同步改 `lib/site.ts` 首页文案、`scripts/site-check.mjs` 的 `HOME_EXPECT`、`scripts/validate-content.ts` 的家数检查 |
| `lib/home-content.ts` | 首页推荐榜说明、按需求选择的分组文字（需随品牌数据同步核对） |
| `data/brands.json` | 品牌与推广链接统一数据（20 个品牌）：地址只在此维护；`dataStatus` 为 verified / reference / pending（2026-11-25 起 20 个品牌均为 verified：价格由站长在品牌官网或用户后台核对，页面标签“价格已核对”；只代表价格，节点、政策、优惠码等仍按资料标注）；`featuredOrder` 为展示顺序 |
| `data/plans.json` | 套餐数据：只录入资料写明的数字；月均与每 GB 由 `lib/plans.ts` 计算 |
| `data/changelog.json` | 全站更新记录（`/updates/` 与首页“最近更新”） |
| `lib/brands.ts` / `lib/plans.ts` / `lib/plan-constants.ts` | 读取并校验数据；客户端组件只能从 `plan-constants` 导入，避免把数据与 zod 打进浏览器脚本 |
| `lib/brand-editorials.ts` | 品牌正文加载与品牌页发布 / 更新日期（页面、JSON-LD、sitemap 共用） |
| `lib/seo.ts` | Metadata 与 JSON-LD（Organization、WebSite、BreadcrumbList、BlogPosting、ItemList、FAQPage；顶层只允许这六种） |
| `lib/content.ts` `lib/faq.ts` | MDX 加载、列表、搜索索引；首页 FAQ |
| `data/redirects.json` | 301 规则（Node 模式由 next.config 处理；静态导出由 `public/_redirects` 处理） |
| `source-materials/` | 站长提供的原始资料与截图（只读） |
| `scripts/` | validate-content、write-indexnow-key、write-redirects、generate-images、site-check、indexnow |
| `docs/` | `seo-tracking.csv`（关键词跟踪表）、`seo-monitoring.md`（检查节奏）、`bing-webmaster-checklist.md`（站长操作清单）、`brand-materials-audit.md`、`content-plan.md` |
| `DEPLOY.md` / `CHECK-REPORT.md` | 部署步骤与上线前待办 / 验收检查报告 |

## 文章 frontmatter

```yaml
title: ""                 # H1，≤ 60 字符，全站唯一
seoTitle: ""              # 可选：较短的 <title>（站点自动追加“ - 机场优选”）
slug: ""                  # 与文件名一致，全站唯一
description: ""           # 50–160 字符，全站唯一
category: guides          # recommend | reviews | compare | speedtest | guides | lingdongyun
tags: []                  # 1–8 个
author: editorial         # lib/site.ts 的 AUTHORS id
publishedAt: "2026-11-12" # 不得为未来日期
updatedAt: "2026-11-12"
changes: [{ date, note }] # 可选：实质修改记录（页面与 /updates/ 显示）
cover: /images/covers/guides.svg
coverAlt: ""
draft: false              # true 时生产环境不生成页面
featured: false
related: []               # 其他文章的 slug
summaryPoints: []         # 核心摘要要点
sources: [{ label, date, note, url }]
methodology: ""
disclosure: ""            # 为空时按 brand 自动生成
plansVerifiedAt: "2026-11-09"
brand: lingdongyun        # 关联品牌（自动插入推广卡片与披露）
regions: []
test: { testedAt, network, tool, method, evidence, limitations }
faq: [{ q, a }]           # 文末可见的常见问题 + FAQPage；正文里不要再写“常见问题”小节
```

品牌正文 frontmatter（`content/brands/*.mdx`）：`brand`、`seoTitle`、`h1`、`description`、`author`、`publishedAt`、`updatedAt`、`summaryPoints`（3–6）、`faq`（3–8）、`related`、`changes`；正文要求 1200 汉字以上、至少 3 条站内链接（`npm run validate` 检查）。

MDX 内可用组件：`<Callout type="info|tip|warning">`、`<Figure src alt width="1600" height="1095" caption />`（尺寸必须写成字符串）、`<PlanTable brand="lingdongyun" />`、`<InlineBrandRecommendation brand="lingdongyun" note="" />`、`<BrandCTA brand="..." label="" />`（必须写 brand）。正文内链用带结尾斜杠的站内绝对路径，正文里不能直接写推广链接。

## 新增或更新品牌

1. 把站长资料放入 `source-materials/brands/`。
2. 在 `data/brands.json` 新增记录（资料没写的字段填 `null` 或空数组，不要猜），在 `data/plans.json` 录入套餐。
3. 运行 `npm run validate`。
4. 价格在品牌官网或用户后台核对后，把 `dataStatus` 改为 `verified`、填写 `verifiedAt`，`plans.json` 的 `priceStatus` 改为 `verified`（页面显示“价格已核对”）。
5. 调整首页推荐榜顺序只能改 `lib/ranking.ts` 并同步 `featuredOrder`，同时在 `data/changelog.json` 记录。

## 内容规则

1. 价格、流量、节点数、优惠码、客服政策只能来自 `source-materials/`，页面注明核对日期或资料日期；资料没有的字段显示“待核实”。
2. 测速数值只能来自站长实测或品牌资料中附带的记录，注明时间、网络、工具、方法与局限；没有测试的品牌不写速度结论。
3. 不显示评分、测速排名、好评率；首页推荐榜是编辑推荐顺序（含推广合作因素），页面必须同时显示这句披露。
4. 推广链接只在 `data/brands.json` 维护，外链 `rel="sponsored nofollow noopener noreferrer"`；披露文案由 `brandDisclosureText()` 统一生成。
5. 草稿（`draft: true`）不发布、不进 sitemap、不进搜索索引。
6. 内容实质变更时修改 `updatedAt` 并写 `changes`；全站性的修改写进 `data/changelog.json`。

## 环境变量

见 `.env.example`：`NEXT_PUBLIC_SITE_ENV`（preview 时全站 noindex）、`NEXT_PUBLIC_SITE_URL`、`NEXT_PUBLIC_CONTACT_EMAIL`、`NEXT_PUBLIC_BING_SITE_VERIFICATION`、`INDEXNOW_KEY`、`STATIC_EXPORT`。
