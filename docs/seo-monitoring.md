# 搜索表现跟踪方案（Bing）

跟踪表：`docs/seo-tracking.csv`（UTF-8 带 BOM，可直接用 Excel 打开）。每次检查新增一行，不要覆盖旧记录，这样能看出趋势。

> 截至 2026-11-16，网站尚未部署（jichangxuan.blog 没有 A/AAAA 记录），表中所有“Bing 是否收录、展示、点击、CTR、平均排名”都是空白，等上线后填写。不要在表里填估算值。

## 跟踪的关键词与页面

| 关键词 | 目标 URL | 意图 |
| --- | --- | --- |
| 机场优选 | `/` | 站名 |
| 机场推荐2026、2026机场推荐 | `/` | 推荐榜（商业调查） |
| 灵动云机场 | `/lingdongyun/` | 品牌 |
| 暮光加速机场 | `/brands/muguang-jiasu/` | 品牌 |
| 微风网络机场 | `/brands/weifeng-wangluo/` | 品牌 |
| 飞猫云机场 | `/brands/feimaoyun/` | 品牌 |
| FLYV机场 | `/brands/flyv/` | 品牌 |
| 浪网机场 | `/brands/langwang/` | 品牌 |
| 隐形人机场 | `/brands/yinxingren/` | 品牌 |
| 大佬云机场、梯子云机场、无忧链接机场、Firefly机场、全球云机场 | `/brands/dalaoyun/`、`/brands/tiziyun/`、`/brands/wuyou/`、`/brands/firefly/`、`/brands/quanqiuyun/` | 品牌（2026-11-25 进入首页推荐榜后补充） |

## 数据从哪里来

- **收录**：Bing Webmaster Tools → URL Inspection（逐个检查目标 URL），或 Search Explorer / Site Explorer。
- **展示、点击、CTR、平均排名**：Bing Webmaster Tools → Search Performance，按“查询”和“页面”分别筛选，时间范围选最近 7 天或 28 天，并在“检查日期”列写明范围。
- **抓取问题**：Bing Webmaster Tools → Site Explorer、Crawl Information；本地对照用 `npm run check:site <线上地址>` 的报告。

## 检查节奏

| 频率 | 做什么 | 记录到 |
| --- | --- | --- |
| 每 7 天 | 用 URL Inspection 复查跟踪表里 13 个目标 URL 是否收录；查看 Site Explorer 是否有新的抓取错误；运行 `npm run indexnow:dry` 确认没有漏提交的修改 | 跟踪表“Bing 是否收录”“发现的问题” |
| 每 14 天 | 在 Search Performance 导出跟踪表里 15 个关键词的展示、点击、CTR、平均排名 | 跟踪表对应列 |
| 每 30 天 | 根据实际数据调整内容：展示多但点击少的页面改 Title / Description；排名在 11–30 名的页面补充内容与内链；长期没有展示的关键词检查页面意图是否对得上 | 跟踪表“下一步优化动作”，实质修改同时写进 `data/changelog.json` |

## 调整内容时的规则

- 只依据真实的展示、点击与排名数据调整，不按 SEO 打分工具的分数改。
- 首页推荐榜顺序是站长指定的，不随搜索表现自动调整；如需调整，由站长决定并写进更新记录（2026-11-25 已由七家调整为 12 家）。
- 改 Title、H1 或正文后，更新 frontmatter 的 `updatedAt` 与 `changes`，重新构建、部署，再运行 `npm run indexnow` 提交变化的页面。
- 不新增和已有文章同主题的页面；同一意图的内容优先在原页面扩写。
