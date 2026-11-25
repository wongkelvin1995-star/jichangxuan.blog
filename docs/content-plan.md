# 内容规划清单（18 篇）

状态说明：**已发布** = 正文完整、资料可靠，生产构建生成页面并进入 sitemap；**待核实草稿** = `draft: true`，生产构建不生成页面、不进 sitemap，开发环境可通过地址预览（带 noindex 与草稿横幅）。

| # | 栏目 | 文件（slug） | 标题 | 状态 | 资料来源 / 待办 |
| --- | --- | --- | --- | --- | --- |
| 1 | guides | windows-client-setup | Windows 机场客户端安装与使用教程 | 已发布 | 通用知识；灵动云政策引自资料 |
| 2 | guides | android-client-setup | Android 机场客户端使用教程 | 已发布 | 通用知识 |
| 3 | guides | ios-client-setup | iOS 机场客户端使用教程 | 已发布 | 通用知识；灵动云 iOS 分发方式待客服确认 |
| 4 | guides | clash-verge-rev-guide | Clash Verge Rev 使用教程 | 已发布 | 通用知识 |
| 5 | guides | tun-vs-system-proxy | TUN 模式与系统代理有什么区别 | 已发布 | 通用知识 |
| 6 | guides | dns-and-connection-troubleshooting | DNS 与连接故障排查 | 已发布 | 通用知识 |
| 7 | recommend | how-to-choose-an-airport-2026 | 2026 机场怎么选 | 已发布 | 通用方法；示例数据来自灵动云资料（2026-11-09） |
| 8 | compare | how-to-read-airport-plans | 看懂机场套餐 | 已发布 | 通用知识；计算示例来自灵动云资料 |
| 9 | compare | lingdongyun-plans-compared | 灵动云套餐横向比较 | 已发布 | 灵动云.txt（2026-11-09），计算值由本站得出 |
| 10 | speedtest | node-regions-explained | 机场节点地区怎么选 | 已发布 | 通用知识 + 引用两份测试记录 |
| 11 | speedtest | lingdongyun-2026-11-10-japan-node-report | 灵动云日本5 节点实测报告（2026-11-10） | 已发布 | 站长实测报告图 |
| 12 | speedtest | lingdongyun-2026-11-01-node-unlock-check | 灵动云 60 个节点解锁检测记录（2026-11-01） | 已发布 | 站主提供的 MiaoKo 截图，逐行转录 |
| 13 | lingdongyun | lingdongyun-introduction | 灵动云是什么 | 已发布 | 灵动云.txt + 品牌介绍文案 |
| 14 | lingdongyun | lingdongyun-client-guide | 灵动云客户端使用教程 | 已发布 | 灵动云.txt；无客户端截图，不描述界面 |
| 15 | lingdongyun | lingdongyun-plans-and-policies | 灵动云套餐、优惠码与支持政策 | 已发布 | 灵动云.txt |
| 16 | reviews | lingdongyun-review-2026 | 灵动云测评（2026） | 已发布 | 资料 + 三份测试记录；不打分 |
| 17 | reviews | flyv-review | 飞V 测评 | 待核实草稿 | FLYV.txt 待逐项核实；需测试记录与站主确认合作关系 |
| 18 | compare | lingdongyun-vs-flyv-vs-muguang-jiasu | 灵动云、飞V、暮光加速套餐比较 | 待核实草稿 | 飞V、暮光加速套餐待核实（暮光资料自注“历史参考”） |

## 覆盖范围对照（任务要求）

| 要求 | 对应文章 |
| --- | --- |
| 机场选择 | 7、10 |
| 套餐比较 | 8、9、18 |
| 节点知识 | 10、11、12 |
| Clash 教程 | 4、1 |
| DNS 和宽带故障 | 6、5 |
| 灵动云介绍 | 13、16 |
| 灵动云客户端使用 | 14、1–3 |
| 灵动云套餐与支持政策 | 15、9 |

## 后续选题（未建文件）

- 灵动云晚高峰站长实测（补齐最大的信息缺口）
- 暮光加速测评（资料核实后）
- 韩国 / 欧洲节点需求者的机场选择（本站暂无测试记录，需先取得记录）
- 机场订阅链接安全：为什么不要分享、泄露后怎么办
- 路由器 / 软路由上使用机场的方案

## 写作规则

1. 价格、流量、节点数、优惠码、客服政策只来自 `source-materials/`，正文注明资料日期。
2. 测速数值只来自站长实测或站主提供的截图 / 记录，并写明时间、网络环境、工具、方法与局限。
3. 不打分、不排名、不写用户好评；推广关系在文内与信息面板中标注。
4. 每篇文章结构独立，不用同一模板批量改写；教程按系统与场景分开。
5. 草稿不得发布；核实后把 `draft` 改为 `false` 并更新 `publishedAt`。
