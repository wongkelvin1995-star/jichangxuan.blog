# 部署指南与上线前待办

适用域名：`https://jichangxuan.blog/`（站名：机场优选）。本文件只写可核对的步骤；没有做过的事项标“待执行”，不要预填通过。

截至 2026-11-24：网站**尚未部署**。`jichangxuan.blog` 已托管在 Cloudflare（NS：coby.ns.cloudflare.com、nelci.ns.cloudflare.com），但没有 A/AAAA 记录；`www` 子域不存在。所有线上检查都要等部署后执行。

## 1. 构建模式

| 模式 | 命令 | 输出 | 301 / 响应头 | 适用 |
| --- | --- | --- | --- | --- |
| Node 服务器 | `npm run build` → `npm start` | `.next/` | `next.config.ts` 的 `redirects()` / `headers()` | Vercel、自建 Node |
| 静态导出 | `STATIC_EXPORT=1 npm run build` | `out/` | `public/_redirects`、`public/_headers` | Cloudflare Pages、任意静态托管 |

Cloudflare Pages 构建环境自带 `CF_PAGES` 变量，`next.config.ts` 检测到后自动切换为静态导出，无需手动设置。

索引策略：不设置 `NEXT_PUBLIC_SITE_ENV` 即为正式站；**只有显式设为 `preview` 时全站 noindex**。预览环境的 robots.txt 仍允许抓取、但不声明 sitemap：爬虫必须能抓取页面，才能读到 noindex。不要把预览构建部署到正式域名。检查预览部署：`node scripts/site-check.mjs <预览地址> --expect-preview`。

## 2. 环境变量（托管平台或 .env.local）

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 否 | 默认 `https://jichangxuan.blog`；canonical、sitemap、JSON-LD 以它为准 |
| `NEXT_PUBLIC_SITE_ENV` | 否 | 正式站不设置；Cloudflare 的 Preview 环境设 `preview` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | 建议 | 联系页与页脚显示的纠错邮箱；不设时联系页说明“邮箱开通中”，并且不显示回复时限承诺 |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | 建议 | Bing 站长工具的 msvalidate.01 值 |
| `INDEXNOW_KEY` | 建议 | 8–128 位字母数字或连字符；构建时生成 `public/<key>.txt` |
| `NODE_VERSION` | Cloudflare | 设为 `22`（Next.js 16 需要 Node ≥ 20.9） |

## 3. Cloudflare Pages（推荐）

1. Workers & Pages → Create → Pages → Connect to Git，选择本仓库，生产分支 `main`。
2. 框架预设：Next.js (Static HTML Export) 或“无”；构建命令 `npm run build`；输出目录 `out`。
3. 环境变量：Production 设 `NODE_VERSION=22` 与第 2 节中的变量；**Preview 环境额外设 `NEXT_PUBLIC_SITE_ENV=preview`**，Production 不要设。
4. Custom domains：绑定 `jichangxuan.blog`（域名 zone 托管在 Cloudflare）。
5. HTTPS：SSL/TLS → Edge Certificates → 开启 **Always Use HTTPS**（http 一跳 301 到 https）。确认稳定运行后再考虑开启 HSTS。
6. www 统一到主域名（`_redirects` 不支持按域名跳转，必须在 Cloudflare 配置）：
   - DNS 添加一条开启代理（橙云）的记录，例如 `CNAME www → jichangxuan.blog`；
   - Rules → Redirect Rules → 用模板 “Redirect from WWW to root”，或自建规则：`https://www.jichangxuan.blog/*` → `https://jichangxuan.blog/${1}`，状态码 301，保留查询串。
7. Bingbot 放行：Security → Bots 中，如开启 Bot Fight Mode / Super Bot Fight Mode，确认“已验证的机器人（Verified Bots）”被允许；WAF 自定义规则不要对 bingbot 发起质询。
8. `public/_headers` 已为 `<project>.pages.dev` 与 `<branch>.<project>.pages.dev` 设置 `X-Robots-Tag: noindex`，避免与正式域名重复收录。
9. 404：Cloudflare Pages 使用 `out/404.html` 并返回 404 状态码；**如果 out/ 里没有 404.html，Pages 会对任意路径返回首页（Soft 404）**，所以部署前要按第 5 节确认。

Windows 上更新依赖后，检查 `package-lock.json` 中原生模块（sharp、lightningcss 等）是否包含 linux-x64 版本，否则 Linux 构建机可能失败；`sharp` 只在 `npm run og` 时需要，不参与构建。

## 4. Vercel / Node 服务器

- 直接 `npm run build`，无需额外设置；Vercel 自动识别 Next.js。
- 自建 Node：`npm ci && npm run build && npm start -- -p 3000`，用反向代理转发到 443。
- Node 模式下 `next.config.ts` 已内置 `www.jichangxuan.blog → jichangxuan.blog` 的 301：带结尾斜杠的地址与文件一跳到达；不带斜杠的 www 地址会先被 Next.js 308 补斜杠，再 301，共两跳（2026-11-24 本地验证）。http → https 由反向代理或平台负责。

## 5. 静态导出的本地验证（部署前执行）

```bash
STATIC_EXPORT=1 npm run build
```

确认 `out/404.html`、`out/sitemap.xml`、`out/robots.txt`、`out/_redirects`、`out/_headers`、`out/plans.json`、`out/brands/<slug>/index.html` 都存在。然后用 Cloudflare 的本地模拟器检查路由、`_redirects` 与 404：

```bash
npx wrangler pages dev out
```

```bash
node scripts/site-check.mjs http://localhost:8788 --out reports/static-site-check.json
```

手工确认：不存在的路径返回 404（不是 200 的首页）；`/about` 308 / 301 到 `/about/`；`/guide` 一跳 301 到 `/guides/`。

## 6. 部署后核对（待执行）

```bash
node scripts/site-check.mjs https://jichangxuan.blog --out reports/site-check-live.json
```

脚本检查 robots.txt、sitemap、RSS、搜索索引、404 状态码、草稿不可访问、IndexNow 密钥文件、每页的 title / description / canonical / H1 / OG / JSON-LD，以及首页 Title / H1 / 推荐榜顺序、FAQPage 与可见问答一致、推广外链 rel 等。全部 ✓ 后再进行下一步。

人工核对：

| 检查 | 方法 | 应得结果 |
| --- | --- | --- |
| https | `curl -sI http://jichangxuan.blog/about/` | 一跳 301 到 `https://jichangxuan.blog/about/` |
| www | `curl -sI https://www.jichangxuan.blog/about/` | 一跳 301 到 `https://jichangxuan.blog/about/` |
| Bingbot | `curl -sI -A "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" https://jichangxuan.blog/` | 200，不是 403 / 503 / 质询页 |
| pages.dev | `curl -sI https://<项目>.pages.dev/` | 带 `x-robots-tag: noindex` |
| 推广链接 | 首页推荐榜、各品牌页按钮 | 指向 `data/brands.json` 中站长确认的地址，`rel` 含 sponsored |
| 禁用 JS | 浏览器禁用 JavaScript 打开首页与任一文章 | 标题、正文、表格、推荐榜文字均可见 |
| 手机宽度 | 360 / 390 / 430 px | 无横向滚动，菜单、表格与购买按钮可用 |

## 7. Bing Webmaster Tools 与 IndexNow（待执行）

完整步骤见 `docs/bing-webmaster-checklist.md`。要点：

1. 验证站点（meta 标签、XML 文件、DNS 或从 GSC 导入）。
2. 提交 `https://jichangxuan.blog/sitemap.xml`。
3. 设置 `INDEXNOW_KEY` 并部署，确认 `https://jichangxuan.blog/<key>.txt` 返回 200 且内容等于密钥；首次运行 `npm run indexnow -- --all`。
4. 之后每次部署后运行 `npm run indexnow`：
   - 提交 sitemap 中新增或 `lastmod` 变化的 URL（lastmod 按页面实际依赖的数据计算）；
   - 自动发现已从 sitemap 移除、并且线上已返回 404 / 410 / 301 / 308 的 URL，一并通知（301 时同时提交新地址）；
   - `--urls /a/,/b/` 只接受 sitemap 中的规范 URL；`--removed /old/` 会先确认该地址已不再返回 200。
5. 记录：`.indexnow/state.json`（每个 URL 最后提交的 lastmod）与 `.indexnow/log.jsonl`（成功、HTTP 失败、网络错误、密钥验证失败、Retry-After）。HTTP 200 / 202 表示通知被接收，不等于已收录。

删除或迁移页面的流程：删文章 → 需要的话在 `data/redirects.json` 加 301 → 构建部署 → 运行 `npm run indexnow`。

## 8. 上线前待办（站长）

- [ ] 确认 `data/brands.json` 中各品牌推广链接是否带本站专属推广码；**浪网的链接没有邀请码参数，微风网络的入口域名与品牌名差异较大**，请确认归属。
- [x] 核对各品牌价格：2026-11-25 站长在品牌官网或用户后台核对了全部 20 个品牌的价格，与页面一致；`dataStatus` / `priceStatus` 已改为 `verified`、`verifiedAt` 为 2026-11-25，页面标签为“价格已核对”。价格以后有变动时重新核对并更新日期。
- [ ] 按 `docs/brand-materials-audit.md` 补齐各品牌缺失字段（分地区节点数、倍率、客服渠道、优惠码适用范围等；2026-11-25 的核对只覆盖价格，这些非价格字段仍待核实）。
- [ ] 提供作者署名与简介（当前为“机场优选编辑部”），更新 `lib/site.ts` 的 `AUTHORS`。
- [ ] 提供联系邮箱（`NEXT_PUBLIC_CONTACT_EMAIL`）。
- [ ] 提供 Bing 验证码与 IndexNow 密钥。
- [ ] 决定 12 个未上榜品牌的资料页是否补写编辑正文（目前是资料整理页，可被收录）。
- [ ] 决定 `flyv-review`、`lingdongyun-vs-flyv-vs-muguang-jiasu` 两篇草稿是否在有测试记录后发布。
- [ ] 如需统计工具，先在隐私页说明后再接入。
- [ ] 初始化 Git 仓库并推送到托管平台（本项目目前未初始化 Git）。
