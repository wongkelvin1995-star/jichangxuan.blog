/**
 * 节点地区知识。这里只写线路与用途的一般性说明，不含任何速度、延迟或解锁数值；
 * 具体数值只出现在有日期、有环境说明的测试报告里。
 */
export interface RegionInfo {
  id: string;
  name: string;
  nameEn: string;
  /** 一般性说明 */
  summary: string;
  /** 常见用途 */
  uses: string[];
  /** 选择时的注意点 */
  tips: string;
}

export const REGIONS: RegionInfo[] = [
  {
    id: "hong-kong",
    name: "香港",
    nameEn: "Hong Kong",
    summary: "距离内地最近、物理延迟通常最低的地区之一，也是大多数机场节点最多的地区。专线（IEPL / IPLC）常以香港为落地点。",
    uses: ["日常网页浏览", "对延迟敏感的在线游戏与视频通话", "港区流媒体与 App Store 港区账号"],
    tips: "节点数多不等于每个都快，晚高峰拥挤程度差异大；购买前看机场是否标明线路类型，并在晚高峰自己测一次。",
  },
  {
    id: "japan",
    name: "日本",
    nameEn: "Japan",
    summary: "常用于日区流媒体、动漫与游戏平台，直连到日本的延迟通常略高于香港，拥有专线的机场差距会缩小。",
    uses: ["日区流媒体（Abema、TVer 等）", "动漫、游戏与日本网站", "作为香港之外的备用低延迟地区"],
    tips: "部分服务会按 IP 判断地区，机场节点能否“解锁”某个服务取决于出口 IP，不同节点可能不同，以检测结果为准。",
  },
  {
    id: "singapore",
    name: "新加坡",
    nameEn: "Singapore",
    summary: "东南亚的网络枢纽，线路通常稳定，也是不少 AI 服务与国际企业的亚太节点所在地。",
    uses: ["ChatGPT、Claude 等 AI 工具", "东南亚地区服务", "稳定性优先的日常使用"],
    tips: "新加坡节点延迟通常略高于香港。具体表现以自己网络环境的实测为准。",
  },
  {
    id: "taiwan",
    name: "台湾",
    nameEn: "Taiwan",
    summary: "地理距离近、延迟通常与香港相当，常用于台区流媒体与游戏，也是部分机场专线的落地地区。",
    uses: ["台区流媒体与游戏", "低延迟备用地区", "繁体中文网站与服务"],
    tips: "台湾节点的可用性通常受机场线路质量影响较大，建议把它作为香港节点之外的第二选择。",
  },
  {
    id: "usa",
    name: "美国",
    nameEn: "United States",
    summary: "跨太平洋传输，物理延迟明显高于亚洲地区，但美区服务最齐全，也是注册很多海外服务的常用地区。",
    uses: ["美区流媒体与软件服务", "需要美国 IP 的注册与验证", "大文件下载对延迟不敏感的场景"],
    tips: "延迟高属于物理限制，不代表机场质量差；选择带 BGP 优化或专线的美国节点通常比普通直连稳定。",
  },
  {
    id: "korea",
    name: "韩国",
    nameEn: "South Korea",
    summary: "延迟介于日本与香港之间，常见于韩区游戏与流媒体需求。并非所有机场都提供韩国节点。",
    uses: ["韩区游戏与流媒体", "韩国网站与服务"],
    tips: "本站目前没有韩国节点的测试记录；需要韩国节点时请先确认机场节点列表里是否提供。",
  },
  {
    id: "europe",
    name: "欧洲",
    nameEn: "Europe",
    summary: "延迟最高的常见地区，通常只在需要欧洲 IP 时使用；部分机场提供德国、英国、荷兰等节点。",
    uses: ["需要欧洲 IP 的服务与注册", "欧洲网站与学术资源"],
    tips: "本站目前没有欧洲节点的测试记录；欧洲节点普遍延迟较高，不适合对延迟敏感的用途。",
  },
];

export function getRegion(id: string): RegionInfo | undefined {
  return REGIONS.find((r) => r.id === id);
}
