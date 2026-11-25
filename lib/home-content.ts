/**
 * 首页与“按需选机场”栏目使用的编辑文字。
 *
 * 规则：
 *  - 每句话都要能在 data/brands.json、data/plans.json 或本站文章中找到依据；品牌说法写“资料显示 / 资料称”。
 *  - 价格于 2026-11-25 由站长在品牌官网或用户后台核对（全部 20 个品牌），购买前以官网结算页为准；价格以外的资料仍是品牌说法。本站只有灵动云的测试记录。
 *  - 不写“最好 / 最快 / 最稳”，不把推荐顺序写成性能结论。
 *  - 数据变动（价格、节点数、客户端政策）后，要同步检查这里的文字。最近核对：2026-11-25（推荐榜调整为 12 家）。
 */

/** 首页推荐榜每家的说明（与 lib/ranking.ts 的顺序对应，按 brandId 取用） */
export const RANKING_NOTES: Record<string, string> = {
  lingdongyun:
    "资料于 2026-11-09 与原文逐项核对，价格于 2026-11-25 由站长在官网或用户后台核对；也是本站唯一有测试记录的品牌：2026-11-01 节点检测与 2026-11-10 实测两份本站记录，另有品牌资料附带的 2026-10-28 晚高峰文字记录，各有不同的范围与局限。资料显示五个地区共 60 个节点，IEPL 专线为主，官方客户端登录即用，符合条件的高流量套餐可向客服申请订阅链接。",
  "muguang-jiasu":
    "资料显示四档周期套餐覆盖每月 120 GB 到 1500 GB，全节点 1x，线路为 BGP 智能路由加 IPLC 专线出口；只推荐官方客户端，资料称不推荐导入 Clash。各地区节点数资料未写，本站暂无测试记录。",
  "weifeng-wangluo":
    "资料显示全 IPLC 专线、53 个节点，入门档每月 200 GB；不限设备，但所有设备共用同一份流量。2026 年 10 月起新订单只能使用官方客户端，不支持导入 Clash。本站暂无测试记录。",
  feimaoyun:
    "资料显示全 IPLC 专线，已计数节点 63 个，另有 ¥84 / 年的学生版（已核对）；资料称支持导入 Clash、小火箭等第三方客户端，但不推荐使用订阅链接。月付套餐的重置规则资料未写，本站暂无测试记录。",
  flyv: "资料显示香港、台湾为 IEPL，日本、新加坡为 IPLC / IEPL，美国为 BGP 直连优化，五个地区共 60 个节点；官方客户端内置分流规则，不对外发放订阅链接。常规套餐不限设备、共享流量，本站暂无测试记录。",
  langwang:
    "资料强调企业级 IEPL 专线与 VLESS 协议，称有 60 个以上节点，顶档每月 2000 GB；支持 Windows、macOS、Android、iOS / iPadOS，目前只能使用官方客户端。各地区节点数与倍率资料未写，本站暂无测试记录。",
  yinxingren:
    "资料显示 IEPL 专线加 BGP 优化，五个地区共 60 个节点（马来西亚节点数待确认），支持 Linux；不限时流量包按 1 / 2 / 3 台限制设备数。只能使用官方客户端，优惠码 yxr888 的适用范围资料未写，本站暂无测试记录。",
  dalaoyun:
    "资料显示 IEPL 专线，六个地区共 60 个节点（各地区数量未写），周期套餐全节点 1x；初云·福利版 ¥19.99 / 月起，两档初云只列月付，所有套餐都没有半年付。资料称可导入 Clash，但不推荐使用订阅链接；付款只支持支付宝，优惠码 dly888 的适用范围未写。本站暂无测试记录。",
  tiziyun:
    "资料按档位区分线路：初阶基础中转、中阶 BGP 中转、高阶 IEPL 专线、顶阶企业级专线集群，周期套餐每月 125–1600 GB，另有 ¥89 / 年的年度保活（每月 60 GB）。资料标注不限设备数量，但节点总数、支持系统、付款方式与退款条件都没写，部分信息来自公开网页（资料日期 2026-11-23）。本站暂无测试记录。",
  wuyou:
    "资料显示全线 IPLC 专线、全节点 1x，入门档舒心链接每月 100 GB、¥19 / 月，周期套餐只有月付、季付和年付。原稿称 2026 年 10 月起新订单只能用官方客户端，第三方调查却记载可向客服申请定制订阅，以客服当前说明为准；优惠码 wuyou666 的有效期待核实。本站暂无测试记录。",
  firefly:
    "资料显示 IPLC 专线、50 个以上节点（各地区数量未写），Lite、Plus、Blaze、Nova 四档每月 150–1000 GB，有月付、季付和年付价格，另有 ¥96 / 年的年付版（每月 60 GB）。2026 年 10 月起新订单只能使用官方客户端，不支持导入 Clash。本站暂无测试记录。",
  quanqiuyun:
    "资料显示 BGP 智能优化加专线出口（轻量版为全 IPLC 专线），港台日新美五个地区合计 60 个节点，另称覆盖马来西亚、德国、土耳其、巴西但未写数量；全节点 1x。资料称不推荐导入第三方客户端，支持系统里列了路由器；设备数有“不限”与第三方“5 台”两种说法，待核实。本站暂无测试记录。",
};

/** 推荐榜卡片与价格表里的“客户端”一栏（据 data/brands.json clientPolicy 归纳） */
export const CLIENT_SHORT: Record<string, string> = {
  lingdongyun: "官方客户端；符合条件的高流量套餐可申请订阅链接",
  "muguang-jiasu": "官方客户端；资料称不推荐导入第三方客户端",
  "weifeng-wangluo": "新订单仅限官方客户端，不支持导入 Clash",
  feimaoyun: "官方客户端；资料称支持导入 Clash、小火箭",
  flyv: "仅官方客户端，不对外发放订阅链接",
  langwang: "仅官方客户端，暂不支持订阅链接",
  yinxingren: "仅官方客户端，不提供订阅链接",
  dalaoyun: "官方客户端；资料称可导入 Clash，但不推荐使用订阅链接",
  tiziyun: "客户端以用户中心提供的为准；第三方订阅未确认",
  wuyou: "原稿称新订单仅限官方客户端；第三方记载可申请定制订阅",
  firefly: "新订单仅限官方客户端，不支持导入 Clash",
  quanqiuyun: "官方客户端；资料称不推荐导入第三方客户端",
};

/**
 * “按需选机场”品牌对照里需要单独措辞的条目：资料只写了用途、没有点名支持哪个平台时，
 * 不能写成“资料列出 Netflix……”。
 */
export const NEED_FACT_OVERRIDES: Record<string, Partial<Record<NeedGroup["brandField"], string>>> = {
  tiziyun: {
    streaming:
      "资料只写针对高清视频与流媒体用户分档配置，Netflix、Disney+ 解锁未逐一验证，YouTube 画质不作保证（本站未测试）；最大档每月 1600 GB",
  },
};

export interface NeedLink {
  label: string;
  href: string;
}

export interface NeedGroup {
  id: string;
  title: string;
  /** 首页与栏目页共用的两三句建议 */
  summary: string;
  /** 栏目页的补充要点 */
  points: string[];
  /** 栏目页品牌对照表用哪一类资料 */
  brandField: "aiTools" | "streaming" | "devices" | "budget" | "client" | "start";
  links: NeedLink[];
}

export const NEED_GROUPS: NeedGroup[] = [
  {
    id: "ai-tools",
    title: "经常用 ChatGPT、Claude、Gemini 等 AI 工具",
    summary:
      "AI 服务按出口 IP 判断地区，节点名称不等于判定结果：本站 2026-11-01 的检测中，OpenAI 把灵动云香港节点判定为台湾（TW）。先看服务官方支持哪些地区，再固定使用一个被支持地区的节点。",
    points: [
      "上榜 12 家的资料都提到 AI 工具，但都是品牌说法（梯子云只写了 AI 工具访问用途，没有保证任何 AI 账号可用）；只有灵动云有本站的检测记录（2026-11-01 解锁检测、2026-11-10 站长报告）。",
      "同一个账号不要频繁切换地区登录；换节点后先确认服务判定的地区。",
      "AI 工具消耗的流量不大，入门档通常够用，更该关注出口地区与延迟。",
    ],
    brandField: "aiTools",
    links: [
      { label: "AI 工具选哪个节点", href: "/speedtest/ai-tools-node-guide/" },
      { label: "灵动云节点解锁检测（2026-11-01）", href: "/speedtest/lingdongyun-2026-11-01-node-unlock-check/" },
    ],
  },
  {
    id: "streaming",
    title: "看 YouTube 4K、Netflix 等流媒体",
    summary:
      "先估流量：高清和 4K 视频每小时要消耗数 GB，经常看剧或多人共用时，要考虑每月 300 GB 以上的档位。能看哪个地区的片库由平台按出口 IP 判断。本站没有任何品牌的 4K 测试。",
    points: [
      "资料列出的流媒体平台都是品牌说法；本站只记录过灵动云日本节点的 YouTube 720p 播放（2026-11-10）。",
      "每月 1500 GB 以上的档位：灵动云凌霄 1500 GB、暮光加速至尊版 1500 GB、全球云商业方案 1500 GB、隐形人钻石穹顶 1600 GB、梯子云顶阶商业·全球骨干 1600 GB、FLYV 商业方案 1800 GB、浪网商业 2000 GB（价格均于 2026-11-25 核对）。",
      "微风网络、FLYV 写明所有设备共用一份流量，多人同时看视频要按全家用量估算。",
    ],
    brandField: "streaming",
    links: [
      { label: "看 YouTube 4K 与 Netflix 需要多少网速和流量", href: "/guides/youtube-4k-netflix-network-guide/" },
      { label: "灵动云日本节点实测（2026-11-10）", href: "/speedtest/lingdongyun-2026-11-10-japan-node-report/" },
    ],
  },
  {
    id: "multi-device",
    title: "一家人多设备共用",
    summary:
      "上榜 12 家的资料都写了周期套餐不限设备（浪网写“无限”；全球云另有第三方说法是 5 台，待核实），但微风网络、FLYV 写明所有设备共用一份流量，隐形人的不限时流量包限 1–3 台设备。电视盒子和路由器通常要用订阅链接，而上榜品牌多数只提供官方客户端。",
    points: [
      "先按家里人数和看视频的频率估每月总流量，再选档位。",
      "需要在路由器或电视上用时，优先看资料写明可以用第三方客户端的品牌，或先问客服。",
      "能用 Clash Verge Rev 等第三方客户端时，可以在电脑上开“允许局域网连接”共享给其他设备；只提供官方客户端的品牌，资料没写是否支持局域网共享，先问客服。",
    ],
    brandField: "devices",
    links: [
      { label: "多设备共用机场", href: "/guides/multi-device-setup/" },
      { label: "TUN 模式与系统代理的区别", href: "/guides/tun-vs-system-proxy/" },
    ],
  },
  {
    id: "budget",
    title: "预算有限",
    summary:
      "上榜 12 家的入门月付在 ¥19–30 之间（每月 100–200 GB），年付小包 ¥79–119 / 年（每月 40–80 GB）。价格于 2026-11-25 由站长在品牌官网或用户后台核对，购买前以官网结算页为准；多数品牌的优惠码不适用年付小包。",
    points: [
      "用量少、只想要一个长期备用的，年付小包折算下来每月不到 ¥10。",
      "比较单价时把所有周期折算成月均，再算每 GB；单价低不代表适合你的用量。",
      "第一次买先选月付最小档，用一两周再考虑长周期。",
    ],
    brandField: "budget",
    links: [
      { label: "预算有限怎么选：12 家机场低价套餐价格对比", href: "/compare/budget-airport-plans-2026/" },
      { label: "机场套餐比较表", href: "/compare/" },
    ],
  },
  {
    id: "third-party-client",
    title: "想用 Clash 等第三方客户端",
    summary:
      "上榜 12 家里，资料写明可以用第三方客户端的是灵动云（符合条件的高流量套餐可向客服申请订阅链接）、飞猫云和大佬云（资料称可导入 Clash，但都不推荐使用订阅链接）；暮光加速、全球云资料称不推荐导入第三方客户端；微风网络、FLYV、浪网、隐形人、Firefly 写明不提供订阅链接；无忧链接原稿不提供订阅、第三方记载可申请定制订阅，梯子云资料未确认，以客服说明为准。",
    points: [
      "Clash Verge Rev、Clash Meta for Android 等客户端用的是 Mihomo（Clash Meta）内核，需要机场提供订阅链接。",
      "网上出售的“订阅链接”不是官方渠道，可能被停用或泄露账号。",
      "只能用官方客户端的品牌，通常没法自己改分流规则（以客户端功能为准），也不方便在路由器上使用。",
    ],
    brandField: "client",
    links: [
      { label: "哪些机场支持 Clash Meta 订阅", href: "/guides/clash-meta-compatible-airports/" },
      { label: "Clash Verge Rev 使用教程", href: "/guides/clash-verge-rev-guide/" },
    ],
  },
  {
    id: "beginner",
    title: "第一次使用机场",
    summary:
      "上榜品牌多数提供官方客户端，账号登录即可连接，不需要先学会导入订阅（梯子云的客户端要在用户中心确认）。第一次购买先选月付最小档，在晚高峰（20:00–23:00）多用几天，再决定要不要买长周期。",
    points: [
      "只从官网下载客户端；宣称“全场免费”“1 折码”的渠道都不是官方。",
      "连上了但网页打不开，多数是代理模式或 DNS 的问题，按教程逐步排查。",
      "退款通常要联系客服申请，购买前先看清各家的退款与试用说明。",
    ],
    brandField: "start",
    links: [
      { label: "2026 机场怎么选", href: "/recommend/how-to-choose-an-airport-2026/" },
      { label: "Windows 客户端教程", href: "/guides/windows-client-setup/" },
    ],
  },
];

/** “不同网络使用需求如何选择机场”模块底部的节点知识入口 */
export const NODE_KNOWLEDGE_LINKS: NeedLink[] = [
  { label: "节点地区怎么选", href: "/speedtest/node-regions-explained/" },
  { label: "IEPL 与 IPLC 有什么区别", href: "/speedtest/iepl-vs-iplc/" },
  { label: "晚高峰变慢怎么办", href: "/speedtest/peak-hour-stability-guide/" },
  { label: "机场流量倍率是什么", href: "/compare/traffic-multiplier-explained/" },
];
