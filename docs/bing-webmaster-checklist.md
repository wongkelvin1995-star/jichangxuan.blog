# Bing Webmaster Tools 操作清单（需站长本人完成）

本站没有获得任何 Bing 账号权限。以下步骤都需要站长登录自己的账号操作；在完成之前，**不能**认为网站已经通过验证、已提交 sitemap 或已被收录。截至 2026-11-16 网站尚未部署，所有线上检查都要等部署后进行。

## 0. 前提：先部署并确认线上可访问

1. 按 `DEPLOY.md` 部署到 Cloudflare Pages（或其他平台），绑定 `jichangxuan.blog`。
2. 在 Cloudflare 开启 Always Use HTTPS，并配置 www → 主域名的 301（步骤见 `DEPLOY.md` 第 3 节）。
3. 在本机运行线上检查，确认 0 失败：
   ```
   npm run check:site -- https://jichangxuan.blog --out reports/site-check-live.json
   ```
4. 用 curl 确认 Bingbot 能拿到正常页面（不是验证码或 403）：
   ```
   curl -sI -A "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" https://jichangxuan.blog/
   ```
   如果返回 403 / 503 或挑战页，检查 Cloudflare 的 WAF、Bot Fight Mode 与 Super Bot Fight Mode：已验证的搜索引擎爬虫（Verified Bots）必须放行。

## 1. 验证网站所有权

任选一种：

- **从 Google Search Console 导入**（如果已在 GSC 验证过）；
- **XML 文件**：下载 `BingSiteAuth.xml` 放到 `public/`，重新构建部署；
- **Meta 标签**：把验证码填进环境变量 `NEXT_PUBLIC_BING_SITE_VERIFICATION`，重新构建部署，页面 `<head>` 会输出 `<meta name="msvalidate.01" ...>`；
- **DNS CNAME**：在 Cloudflare DNS 添加 Bing 给出的 CNAME 记录。

验证成功后，在 Bing Webmaster Tools 的站点列表中能看到 `https://jichangxuan.blog/`。

## 2. 提交 sitemap

Sitemaps → Submit sitemap → 填 `https://jichangxuan.blog/sitemap.xml`。
提交后几天内状态应变为 Success，URL 数量与本地 `sitemap.xml` 一致（以构建结果为准，2026-11-16 本地构建约 60 个）。

## 3. IndexNow

1. 在 `.env.local`（本机）和部署平台的环境变量里设置 `INDEXNOW_KEY`（8–128 位字母、数字或连字符），重新构建部署；构建时会生成 `/<key>.txt`。
2. 浏览器打开 `https://jichangxuan.blog/<key>.txt`，内容应等于密钥。
3. 首次上线提交全部 URL：
   ```
   npm run indexnow -- --all
   ```
   之后每次发布或修改内容，部署后运行 `npm run indexnow`（只提交新增、lastmod 变化或已删除 / 迁移的 URL）。
4. 在 Bing Webmaster Tools → IndexNow 查看是否收到提交；本地记录在 `.indexnow/log.jsonl`。HTTP 202 表示密钥仍在验证，接收不等于收录。

## 4. URL Inspection

逐个检查：首页、`/lingdongyun/`、首页推荐榜上的 11 个 `/brands/<slug>/` 品牌页（2026-11-25 起推荐榜为 12 家，灵动云在 `/lingdongyun/`）、`/compare/`、两三篇文章。确认：

- 能抓取（不是 Blocked by robots.txt）；
- 抓到的 HTML 里有正文、H1 与推荐榜（用 “Live URL” 测试）；
- canonical 指向自身；没有意外的 noindex。

## 5. Site Explorer 与 Crawl 信息

- 查看是否有 4xx / 5xx、重定向链或被 robots 屏蔽的 URL；
- 本站有意设为 noindex 的只有 `/search/`、`/tags/` 与标签页、404 页；这些出现 “Excluded by noindex” 属于正常；
- 旧地址（`data/redirects.json` 里的 15 条）应显示 301 到新地址。

## 6. robots.txt 与 noindex

- Bing Webmaster Tools → robots.txt Tester，确认首页与文章都允许抓取，`Sitemap:` 声明可见。
- 本站 robots.txt 只禁止 `/_next/data/`；`/search/` 改为允许抓取并依赖页面上的 noindex。

## 7. 重复 canonical 与“已提交未收录”

- 在 Site Explorer / Index 报告中筛选 “Duplicate” 或 “Alternate page with proper canonical”：`/compare/?brand=...` 这类带参数的旧链接已从站内移除，若仍出现，确认它们的 canonical 指向 `/compare/`。
- “Discovered but not crawled” 或 “Submitted but not indexed” 的页面：先用 URL Inspection 请求抓取；持续两周以上未收录的，检查内容是否过薄或与其他页面重复，并记录到 `docs/seo-tracking.csv`。

## 8. 记录结果

每完成一步，在 `docs/seo-tracking.csv` 的“发现的问题”“下一步优化动作”里写一行，并注明日期。不要在跟踪表或报告里写“已收录”“已验证”，除非 Bing Webmaster Tools 里确实显示了。
