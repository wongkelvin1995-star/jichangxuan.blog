# jichangxuan.blog 验收检查报告

检查日期：2026-11-12（北京时间）
检查对象：本地生产构建（`npm run build` → `next start -p 3100`）与静态导出（`STATIC_EXPORT=1 npm run build` → `out/`）
网站尚未部署，所有“线上”项目标为**待验证**，不报告为通过。

> 说明：验收指令针对“当前项目”，但 2026-11-12 开始时目录为空（无任何文件）。因此先按开发规范完整建站，再按下列 12 项逐条检查；检查中发现的问题已修复并复验。

## 结论总览

| # | 检查项 | 结论 | 依据 |
| --- | --- | --- | --- |
| 1 | 首页符合 Pure Blue Editorial 风格 | **通过** | 浏览器截图核对：背景 #F7F9FC、卡片 #FFFFFF、正文 #14273D、品牌蓝 #2563EB、浅蓝 #DCEBFF、边框 #D9E2EC；1200px 容器、14px 圆角、8px 间距系统；淡蓝科技线条背景、留白充足 |
| 2 | 桌面 / 平板 / 手机正常 | **通过** | 360、375、430、768、1440 视口逐一检查；5 个代表页面 `scrollWidth === innerWidth`（无横向溢出）；折叠菜单、搜索、筛选、分页可用 |
| 3 | 导航与文章卡片进入真实页面 | **通过** | 抓取 85 个 HTML 页面，站内链接全部 200；15 条旧地址 301 规则全部到达目标 |
| 4 | 每篇文章输出完整 HTML | **通过** | 16 篇已发布文章正文在服务端 HTML 中（`.prose-article` 字数 1900–2200），不依赖客户端请求；MDX 构建期编译 |
| 5 | Title / Description / Canonical | **通过** | 85 页标题与描述全站唯一；canonical 为自引用绝对地址（规范域名 + 结尾斜杠）；og:url 与 canonical 一致；每页单一 H1；`html lang="zh-CN"` |
| 6 | Sitemap / Robots / Schema | **通过（本地）** | sitemap 30 个 URL，全部 200、带 lastmod、无重复；robots.txt 声明 sitemap；JSON-LD（Organization、WebSite、BreadcrumbList、Article / TechArticle、FAQPage、CollectionPage）全部可解析。**待验证**：线上富媒体结果校验需部署后执行 |
| 7 | IndexNow 配置与线上提交 | **配置通过，提交待部署** | 密钥文件生成脚本、提交脚本（变更检测、密钥文件在线校验、日志）已就绪；`INDEXNOW_KEY` 未设置，未发送任何提交 |
| 8 | 灵动云推荐模块链接 | **通过（待站主确认推广码）** | 全站唯一外链为 `lib/brands.ts` 中站主资料提供的推广链接，`rel="sponsored nofollow noopener noreferrer"`，新标签页打开；资料未提供官网主域名，未猜测 |
| 9 | 无虚构套餐 / 评分 / 测速 / 用户评价 | **通过** | 价格、节点、优惠码、政策全部来自 `source-materials/`（核对日期 2026-11-09）；测速数值来自三份有日期记录并注明环境与局限；无评分、排名分、好评率；飞V、暮光加速未核实不展示价格与外链；校验脚本含禁用字样检查 |
| 10 | 无重复内容 / 空白页 / 死链 / 错误 | **通过** | 死链 0；404 返回 HTTP 404 并渲染自定义页；2 篇草稿返回 404；构建 0 错误 0 警告；每个栏目至少 1 篇文章并有模块内容 |
| 11 | 阅读体验与加载性能 | **部分通过，指标待验证** | 正文 760px、目录、进度条、返回顶部、上一篇 / 下一篇均可用；无 Web 字体、封面为 SVG、证据图为 ≤1600px webp 且声明尺寸并懒加载；HTML 平均 62 KB、最大 251 KB（首页）。**待验证**：LCP / CLS / INP 未做实验室测量（本环境无 Lighthouse） |
| 12 | 商业关系披露清楚 | **通过** | 首页灵动云模块、专区页首与购买模块、每篇相关文章的信息面板与推广卡片、页脚、`/disclosure/` 页面均披露推广合作；不自称独立第三方 |

## 自动检查命令与结果

```bash
npm run validate     # ✓ 18 篇（已发布 16，草稿 2）
npm run typecheck    # ✓ 无错误
npm run lint         # ✓ 无错误、无警告
npm run build        # ✓ 93 个静态路由
STATIC_EXPORT=1 npm run build   # ✓ out/：89 个 HTML、404.html、sitemap.xml、robots.txt、rss.xml、search-index.json、_redirects、_headers
node scripts/site-check.mjs http://localhost:3100   # 通过 20，警告 1（INDEXNOW_KEY 未设置），失败 0
```

`site-check` 覆盖：robots、sitemap（200 / 规范域名 / 结尾斜杠 / lastmod / 去重）、RSS、搜索索引、404 状态码、草稿隔离、IndexNow 密钥文件、301 规则、每页 lang / title / description / H1 / canonical / OG / robots 指令 / JSON-LD / 图片 alt 与尺寸 / 站内链接 200 与结尾斜杠 / 外链 rel / 文章正文字数 / 禁用字样。报告输出到 `reports/site-check.json`。

## 浏览器检查（Claude 桌面应用内置浏览器）

| 视口 | 页面 | 结果 |
| --- | --- | --- |
| 360×780 | 首页、套餐比较、Clash 教程、灵动云专区、机场推荐、节点实测、解锁检测 | 无横向溢出；套餐表变为卡片并显示数值；目录折叠可用 |
| 375×812 | 首页（含折叠菜单）、实测报告文章、灵动云专区、搜索页（q=Clash → 6 条） | 正常 |
| 430×900 | 首页套餐比较模块 | 正常 |
| 768×1024 | 首页全程 | 正常；套餐表在容器内横向滚动，页面不溢出 |
| 1440×900 | 首页、TUN 文章（右侧目录高亮、进度条 53%、返回顶部显示）、套餐比较（周期=年付 → 5 条） | 正常；入场动画 playState=finished、opacity=1 |

交互：FAQ 以 Enter 展开、ArrowDown 移动焦点（aria-expanded 正确）；首页分类切换按钮切换后显示对应栏目文章；筛选变更后 `aria-live` 计数更新。

## 本次验收中发现并修复的问题

1. `CategoryMeta` 类型未从 `lib/site.ts` 导出 → 改为从 `lib/types` 导入。
2. 页头在 effect 中同步 setState（React 编译器 lint 错误）→ 用“打开时的路径”派生状态，路径变化自动关闭菜单。
3. 两篇测速报告的证据图缺少 width / height（CLS 风险）：根因是 next-mdx-remote 不传递 `width={925}` 表达式属性 → 改为字符串属性并在组件注释与 README 说明。
4. 标签索引页缺少 BreadcrumbList JSON-LD；54 个标签页描述短于 50 字符 → 已补充。
5. 套餐比较表在窄屏重复渲染两份 DOM → 改为单份表格 + CSS 卡片化；随后发现 `.table-wrap table` 的 min-width 覆盖了卡片模式 → 提高选择器优先级。
6. 静态导出失败：`/[category]/page/[page]` 的 `generateStaticParams` 为空数组 → 文章与分页合并为 `[category]/[...rest]`，全部文章页改为 `articles/[[...page]]`。
7. 入场动画时长从 600ms 缩短到 480ms、延迟缩短，减少首屏内容被延迟显示的时间。

## 待验证（需部署后执行）

- 线上 `https://jichangxuan.blog/` 的 HTTPS、www 跳转、响应头（`_headers` 或 `next.config` headers）。
- `node scripts/site-check.mjs https://jichangxuan.blog` 全部通过。
- Bing Webmaster Tools 验证、sitemap 提交、URL 检查。
- IndexNow：密钥文件在线可访问后 `npm run indexnow:dry` → `node scripts/indexnow.mjs --all`。
- Core Web Vitals（LCP ≤ 2.5s、CLS ≤ 0.1、INP ≤ 200ms）：用 PageSpeed Insights 或 Lighthouse 在线上测量。
- 结构化数据：用 Bing / Google 的富媒体结果测试工具校验。

## 尚需站主提供

| 事项 | 位置 | 当前状态 |
| --- | --- | --- |
| 灵动云推广链接确认（是否本站专用推广码） | `lib/brands.ts` | 使用站主资料中的链接 |
| 灵动云官网主域名（如需展示） | `lib/brands.ts` `officialUrl` | null，未猜测 |
| 作者署名与简介 | `lib/site.ts` `AUTHORS` | “机场选编辑部” |
| 联系邮箱 | `NEXT_PUBLIC_CONTACT_EMAIL` | 未设置，联系页显示“待站主填写” |
| Bing 验证码 | `NEXT_PUBLIC_BING_SITE_VERIFICATION` | 未设置 |
| IndexNow 密钥 | `INDEXNOW_KEY` | 未设置 |
| 灵动云客户端截图、支持系统清单、付款方式、退款条件、订阅申请条件 | 文章中标注“资料未写明” | 待补充 |
| 飞V、暮光加速资料核实与合作关系 | 2 篇草稿、`lib/brands.ts` | 待核实，不展示价格与外链 |
| 灵动云晚高峰站长实测 | 节点实测栏目 | 仅有资料提供方文字记录 |

## 发布前待办

- [ ] 初始化 Git 仓库并推送到托管平台（本项目未初始化 Git）。
- [ ] 在托管平台设置环境变量（见 `DEPLOY.md` 第 2 节）。
- [ ] 部署后执行“待验证”清单。
- [ ] 核对 `/contact/` 邮箱与 `/about/` 作者信息已更新。

检查人：机场选编辑部（Claude Code 协助执行）。本报告只记录实际运行过的检查；未运行的项目一律标为待验证。

---

# 补充检查（2026-11-13）：品牌资料库接入

站主 2026-11-13 提供 16 份品牌资料（5 份原稿 .txt、11 份含补充核验的 .md），连同已有的飞V、暮光加速，共 18 个非灵动云品牌接入站点。资料缺口与冲突的逐品牌检查见 `docs/brand-materials-audit.md`。

## 做了什么

- 品牌与套餐数据改为 `data/brands.json`（19 个品牌）与 `data/plans.json`，用 zod 校验；`npm run validate` 新增品牌数据检查（id / slug 唯一、套餐与品牌对应、资料文件存在、定位与简介不含横向排名表述）。
- 新增品牌资料库 `/brands/` 与 18 个品牌页 `/brands/<slug>/`（灵动云仍用专题页）：页首状态徽章与披露、套餐表（只显示资料提供的周期列，缺的显示“—”）、资料档案、补充核验表与矛盾清单、购买流程、相关阅读。
- 套餐比较表新增品牌筛选与“资料状态”列（已核对 / 原稿参考价 + 日期），支持 `?brand=<id>` 预设；比较页先服务端渲染各品牌入门档（50 条），再加载静态 `/plans.json`（320 条）用于筛选，HTML 从 494 KB 降到约 110 KB；各品牌页的套餐表仍完整输出在 HTML 中。
- 机场推荐页改为 19 个品牌卡片网格；首页推荐模块仍按精选顺序显示前 3 个。
- 披露页表格由数据生成：19 个品牌的商业关系、资料状态、资料日期、推广外链；页脚、首页 FAQ、关于页同步说明“品牌库中其他品牌的购买链接也是站主提供的推广链接”。
- 原稿中的横向排名表述（“34 家中并列第 1”等）未进入页面；成立年份、协议、设备数等冲突字段只在“补充核验”中列出并标“待核实”。

## 检查结果

```bash
npm run validate     # ✓ 文章 18 篇；品牌 19 个（已发布 19）
npm run typecheck    # ✓
npm run lint         # ✓
npm run build        # ✓ 新增 /brands/ 与 18 个品牌页、/plans.json
node scripts/site-check.mjs http://localhost:3100   # 通过 20，警告 1（INDEXNOW_KEY 未设置），失败 0；抓取 104 页，sitemap 49 个 URL，外链 19 个全部 rel=sponsored
```

第一次检查曾在灵猫、跨界、光速云三个品牌页检出“横向排名表述”（矛盾清单里引用了原稿的排名原文），已改写为不含排名数字的说明后复验通过。

浏览器复核（内置浏览器）：品牌库首页与品牌页（隐形人、光速云、Sogo 云）在桌面宽度显示正常；手机宽度（375）下品牌库首页（19 张卡片）与 Sogo 云品牌页无横向溢出、套餐表 8 行可见；`/compare/?brand=wuyou` 在手机宽度下预设品牌筛选生效（15 条）。

## 仍待站主提供（按 docs/brand-materials-audit.md）

- 2026-11-13 站主已补充：浪网（英文名、定位、支持系统、试用、付款）、隐形人（优惠码 8 折一次性、付款、客户端政策）、闪跃（流量规则、不限设备、标称 1x、退款、付款）、光速云（套餐页截图：四档改为 168 / 268 / 568 / 938 GB，季 / 半年 / 年价格齐全，轻量B版 69 GB，优惠码 8 折）；此前未写付款方式的 12 个品牌统一确认为支付宝、微信、USDT；退款渠道统一确认为联系客服申请。
- 仍待补充：各地区节点数（9 个品牌完全未写、6 个只列核心地区，见 docs/brand-materials-audit.md 第二节第 8 条）；客服渠道（11 个品牌）；光速云两年 / 三年付价格（月付 ¥25 / ¥138 已由站主确认）；闪跃的结转、重置日期与加油包确认结果；隐形人优惠码适用范围。
- 批量项：各品牌付款方式、退款条件、试用、客服渠道、各地区节点数。
- 测速图：jichang-zhinan 项目中飞V、浪网、隐形人的站长报告图与微风、飞猫的截图，确认后可转录。
- 所有推广链接是否为本站专用推广码（2026-11-25 站长已提供 20 个品牌的新链接，已全部替换）。

---

# 补充检查（2026-11-16 至 2026-11-25）：Bing SEO 全站优化

按站长 2026-11-16 的《Bing SEO 全站优化执行指令》先审计、再修改、再验证。完整说明（问题清单、修改内容、文件、首页文案、推荐榜顺序与 URL（2026-11-25 起 12 家）、IndexNow、Bing 待办、待补资料）见 `docs/seo-report-2026-11-24.md`；本节只记录实际运行过的检查。网站仍未部署，线上项目一律为**待验证**。

## 做了什么（摘要）

- 站名改为“机场优选”；首页 Title / Description / H1 / 副标题逐字使用指令文案，9 个 H2 与 7 个排行 H3 按指令顺序排列，推荐榜上方的说明框写明“编辑推荐顺序，包含推广合作因素，不是测速或评分排名”（2026-11-25 站长把推荐榜调整为 12 家：排行 H3 改为 12 个，第四个 H2 改为“十二家热门机场套餐价格比较”，Title、Description、副标题按原句式改为 12 家版本，见下一节）。
- 本轮优化后 /compare/ 不再读取 `?brand=<id>` 参数（站内也不再生成这类带参数的链接，带参数的地址 canonical 指向 `/compare/`），上文 2026-11-13 记录中的“`?brand=<id>` 预设”已不适用；品牌筛选用页面上的下拉框。
- 七个品牌页各有 1702–2004 个汉字的编辑正文、独立 Title / Description / H1、可见常见问题、BlogPosting、发布 / 更新日期与资料来源；新增 8 篇专题文章；现有 16 篇文章补 133 条正文内链。
- 顶层结构化数据只用 WebSite、Organization、BreadcrumbList、BlogPosting、ItemList、FAQPage（只在问答可见时）。
- sitemap / 站内搜索 / IndexNow 共用一套 lastmod 规则；IndexNow 脚本补齐删除检测、在线检查与失败日志；新增 /updates/ 更新记录；测评方法页与披露页说明推荐榜排序原则。
- 2026-11-24 代码复核（运行时、SEO、事实、导出与抓取、界面无障碍与性能五个方向）确认的 13 条问题已修复；2026-11-25 独立复验确认这些修复有效，并另找出 11 个小问题，已修复（详见报告第 1、2、10 节）。

## 检查结果（2026-11-25 00:24 构建，推荐榜调整为 12 家之前）

推荐榜调整为 12 家、新增梯子云之后的检查结果见下一节。

```bash
npm run validate     # ✓ 文章 26 篇（已发布 24，草稿 2）；品牌正文 7 篇；品牌 19 个；推荐榜顺序一致
npx tsc --noEmit     # ✓
npx eslint .         # ✓
npm run build        # ✓ 154 个页面
STATIC_EXPORT=1 npm run build   # ✓ out/：149 个 HTML（含 404.html）、sitemap、robots、_redirects、_headers
node scripts/site-check.mjs http://localhost:3100   # 通过 22，警告 1（INDEXNOW_KEY 未设置），失败 0；抓取 145 页，sitemap 59 个 URL
# 静态导出用模拟 Cloudflare Pages 的本地服务器托管后同样：通过 22，警告 1，失败 0
node scripts/lighthouse-check.mjs http://localhost:3100 --runs 3 --out reports/lighthouse-2026-11-25
```

- Lighthouse（每项 3 次取中位数）：6 个页面桌面端性能都是 100；移动端首页 79、灵动云专区 81、暮光加速品牌页 82、套餐比较 90、按需选机场 89、Clash Verge Rev 教程 87；无障碍、最佳实践、SEO 都是 100，CLS 都是 0。移动端扣分来自首次排版的长任务（首页中文正文量大），详见报告第 10 节。
- 独立复验：运行时无障碍 21 项、交互回归（59 个页面在手机与桌面宽度下无控制台错误与失败请求、套餐筛选、菜单、常见问题键盘操作、搜索、404）全部通过；页内锚点 138 次测量都停在距顶部 95.5–96.5px。
- 移动端：360 / 390 / 430 / 768 / 1024 / 1440 × 10 个页面共 60 项，全部无横向溢出（截图在 `reports/mobile-2026-11-24/`，最终构建上重拍）。
- www 跳转（Node 模式，本地 Host 头验证）：带斜杠地址与文件一跳 301 到主域名；不带斜杠的 www 地址两跳。
- IndexNow：干运行 59 个 URL 线上均无法连接，未提交、未记录。
- **待验证**：所有线上项目（HTTPS、www、Bingbot 放行、Bing 验证与收录、IndexNow 首次提交、真实用户的 Core Web Vitals）。

---

# 补充检查（2026-11-25）：推荐榜调整为 12 家、新增梯子云、更换推广链接

站长 2026-11-25 提供新推广链接，并把首页推荐榜改为 12 家（灵动云、暮光加速、微风网络、飞猫云、大佬云、FLYV 飞V、浪网、隐形人、梯子云、无忧链接、Firefly、全球云）。改动说明见 `docs/seo-report-2026-11-24.md` 第 11 节，这里只记录实际运行的检查。

```bash
npm run validate     # ✓ 文章 26 篇（已发布 24，草稿 2）；品牌正文 12 篇；品牌 20 个；推荐榜 12 家顺序一致
npx tsc --noEmit     # ✓
npx eslint app components lib   # ✓
npm run build        # ✓ 155 个页面（2026-11-25 15:26）
STATIC_EXPORT=1 npm run build   # ✓ out/：150 个 HTML（含 404.html）
node scripts/site-check.mjs http://localhost:3100   # 通过 22，警告 1（INDEXNOW_KEY 未设置），失败 0；抓取 146 页，sitemap 60 个 URL
# 静态导出用模拟 Cloudflare Pages 的本地服务器托管后同样：通过 22，警告 1，失败 0
```

- 首页：Title、Description、H1、9 个 H2、12 个排行 H3、链接与 ItemList 顺序与 `scripts/site-check.mjs` 的 `HOME_EXPECT` 一致。
- 12 个上榜品牌页都有编辑正文（1702–2004 个汉字）、可见常见问题与 FAQPage、BlogPosting；外链 30 个，推广链接 20 个均带 `rel="sponsored"`。
- 移动端：6 个宽度 × 12 个页面共 72 项，全部无横向溢出（截图在 `reports/mobile-2026-11-25/`）。
- 第一次静态导出检查有 2 项失败：披露页与隐形人品牌页各有一句“12 家中……”触发“横向排名表述”规则。没有放宽规则，改了措辞后复查通过。
- Lighthouse：首页移动 71、桌面 87；梯子云品牌页移动 71、桌面 100；大佬云品牌页移动 70、桌面 96。无障碍、最佳实践、SEO 都是 100，CLS 都是 0。但运行时本机 CPU 被其他应用占用（平均 81%），这组数偏低、波动大，不能和上一节的空闲时结果比较，详见报告第 11 节。**待机器空闲时重测。**
- 首页变重：DOM 元素 1499 → 1817，HTML 287 KB → 342 KB（12 张排行卡与 12 行价格表）。
- 同日稍后：低价对比、流量倍率、Clash 订阅、多设备、AI 工具节点、IEPL 与 IPLC、晚高峰、YouTube 4K 八篇对比文章扩为 12 家；全球云优惠码适用范围按原稿改正。17:15 构建重跑：`npm run validate` 通过；Node 与静态导出 `site-check` 都是通过 22、警告 1、失败 0（146 页，sitemap 60 个 URL）；移动端 72 项全过。
- **待验证**：同上一节，所有线上项目；Lighthouse 待机器空闲时重测。

---

# 补充记录（2026-11-25）：20 个品牌价格经站长核对

站长 2026-11-25 在各品牌官网或用户后台核对了全部 20 个品牌的价格，与本站显示一致（包括此前标“与折扣比例不符，待核实”的微风网络御风年付 ¥998、飞猫云宇宙版年付 ¥1360）。改动说明见 `docs/seo-report-2026-11-24.md` 第 12 节。

- `data/brands.json` / `data/plans.json`：20 个品牌的 `dataStatus` / `priceStatus` 改为 `verified`，`verifiedAt` 为 2026-11-25；状态标签由“资料已核对”改为“价格已核对”。全站“原稿参考价”“未在品牌后台核实”等价格说法改为“价格于 2026-11-25 由站长在品牌官网或用户后台核对，购买前以官网结算页为准”。
- 只改价格状态，价格数字未动。节点、设备数、客户端政策、退款、试用、成立时间等非价格信息与优惠码适用范围仍按原标注“待核实”；测试记录说法不变（只有灵动云有本站测试记录），价格核对不是测速或解锁测试。
- 按需选机场的 AI 工具栏只列可使用的 AI 工具（站长要求）。
- 本节只记录改动。

构建与检查已运行（见下一节），结果：通过。

---

# 补充记录（2026-11-25）：机场测评专区扩充为 12 篇

- 新增 11 篇资料分析型测评（暮光加速、微风网络、飞猫云、大佬云、隐形人、FLYV 飞V、浪网、梯子云、无忧链接、Firefly、全球云），每篇由一个代理写作、另一个代理对照 `data/brands.json`、`data/plans.json`、原始资料逐项核对并修正；正文 1884–1999 个汉字，摘要 103–120 字，15 个固定 H2，文中没有测速、延迟、丢包、解锁成功率、评分或用户评价。FLYV 沿用从未发布的草稿地址 `/reviews/flyv-review/`，没有产生重复文章。
- 灵动云测评保留原地址与三份测试记录，换用独立封面、补筛选标签与相关测评链接。
- 12 张独立封面（`public/images/covers/review-*.svg`）与同名 OG 图（`public/images/og/review-*.png`），由 `npm run og` 生成。
- 测评专区：标题“2026机场测评文章”、文章数自动统计、按站长指定顺序、桌面三列 / 平板两列 / 手机一列；筛选（全部、套餐分析、节点线路、AI应用、流媒体、性价比）按文章真实标签运行。目前 12 篇都写了 AI 工具与流媒体资料，所以这两个筛选结果是全部 12 篇；性价比 6 篇。
- 首页价格表、按需选机场各表、套餐比较表、对比文章表格里的品牌名链接到对应测评；品牌资料页按钮与购买按钮不变；品牌页与首页榜单加“阅读X测评”链接。
- 测评正文里有“常见问题FAQ”小节，文章模板不再重复渲染 FAQ；FAQPage 结构化数据与正文逐字一致（脚本比对 11 篇通过，灵动云沿用模板渲染）。

```
npm run typecheck   # ✓
npm run lint        # ✓
npm run build       # ✓ 183 个静态页面（prebuild 内 validate 通过；4 个品牌页描述超 160 字，已缩短后通过）
node scripts/site-check.mjs http://localhost:3100   # 通过 21，警告 1（INDEXNOW_KEY 未设置），失败 0；抓取 174 页，sitemap 72 个 URL
```

- 12 篇测评：HTTP 200、在 sitemap 中、canonical 指向自身、无 noindex、单一 H1、Title 与 Description 各不相同、独立 og:image、BlogPosting + BreadcrumbList + FAQPage，无 Review / AggregateRating。
- 移动端：320 / 375 / 390 / 768 / 1024 / 1440 六个宽度 × 16 个页面（测评专区、12 篇测评、首页、按需选机场、套餐比较）共 96 项，全部无横向溢出。
- **待验证**：线上部署、Bing 收录与 IndexNow 提交（未部署，未提交）；Lighthouse 待机器空闲时重测。