import Link from "next/link";

import { getPublishedBrands } from "@/lib/brands";
import { getPublishedArticles, getSpeedtestReportsByRegion } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { HOME_RANKING } from "@/lib/ranking";

const PAGE_NAV = [
  { id: "lingdongyun-intro", label: "灵动云介绍与套餐" },
  { id: "ranking", label: "2026 推荐排行榜" },
  { id: "prices", label: "十二家套餐价格比较" },
  { id: "needs", label: "按需求选择" },
  { id: "tutorials", label: "客户端与订阅教程" },
  { id: "faq", label: "常见问题" },
  { id: "latest", label: "最新文章" },
  { id: "about-site", label: "关于与更新说明" },
];

/** 首页 H2「2026 年热门机场推荐概览」：本页讲什么、数据从哪来、怎么用 */
export function HomeOverview() {
  const brands = getPublishedBrands();
  const ranked = HOME_RANKING.map((r) => brands.find((b) => b.id === r.brandId)).filter((b): b is NonNullable<typeof b> => !!b);
  const verified = ranked.filter((b) => b.dataStatus === "verified");
  const records = new Set([...getSpeedtestReportsByRegion().values()].flat().map((a) => a.path)).size;
  const articleCount = getPublishedArticles().length;
  const latestMaterial = ranked.map((b) => b.materialDate).sort().at(-1);
  const latestVerified = verified.map((b) => b.verifiedAt ?? "").filter(Boolean).sort().at(-1);
  const facts = [
    { value: `${ranked.length} 家`, label: "首页重点介绍的机场" },
    { value: `${verified.length} 家`, label: `价格已由站长核对（${latestVerified ? formatDate(latestVerified) : "日期待补"}）` },
    { value: `${records} 份`, label: "有日期的本站测试记录（灵动云）" },
    { value: `${brands.length} 个`, label: "品牌资料库收录的品牌" },
    { value: `${articleCount} 篇`, label: "已发布的原创文章" },
  ];

  return (
    <section id="overview" className="container-x scroll-mt-24 py-12 md:py-16" aria-labelledby="overview-title">
      <span className="section-kicker">Overview</span>
      <h2 id="overview-title" className="section-title">
        2026 年热门机场推荐概览
      </h2>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4 text-[0.98rem] leading-relaxed text-ink-soft">
          <p>
            机场优选把首页重点介绍的十二家机场——
            {HOME_RANKING.map((r, i) => {
              const b = ranked.find((x) => x.id === r.brandId);
              if (!b) return null;
              return (
                <span key={r.brandId}>
                  <Link href={b.hubPath ?? `/brands/${b.slug}/`} className="font-semibold text-brand-strong hover:underline">
                    {r.displayName}
                  </Link>
                  {i < HOME_RANKING.length - 1 ? "、" : ""}
                </span>
              );
            })}
            ——的套餐价格、节点线路、设备与客户端政策整理在同一页。十二家的价格由站长在 {latestVerified ? formatDate(latestVerified) : "待补日期"} 逐家在官网或用户后台核对过；节点线路、设备与客户端政策来自品牌资料（最近的资料日期为 {latestMaterial ? formatDate(latestMaterial) : "待核实"}），资料没写或有冲突的项目标为“待核实”。
          </p>
          <p>
            挑机场时最容易忽略的往往不是月付差几块钱，而是这几件事：流量是不是全家设备共用一份、能不能用 Clash 等第三方客户端、退款要怎么申请，以及资料里线路写到什么程度。多数品牌的资料把线路标为 IEPL 或 IPLC 专线，但写法详略不一；梯子云按档位区分，初阶是基础中转、中阶是 BGP 中转（资料称这两档并非 IEPL 全专线），高阶为 IEPL、顶阶为企业级专线集群。其余几项差别明显。下面的推荐榜给出编辑推荐顺序和每家的要点，价格表把入门套餐、年付小包和不限时流量包放在一起，需求分组说明不同用途该看哪些条件。
          </p>
          <p>
            测试方面，本站目前只有灵动云的有日期记录；其余十一家的速度与稳定性还没有本站测试，页面不写任何估算结果。推荐顺序包含推广合作因素，不是测速或评分排名，排序原则见
            <Link href="/methodology/#ranking" className="font-semibold text-brand-strong underline underline-offset-2">
              推荐榜排序原则
            </Link>
            。
          </p>
        </div>
        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-3">
            {facts.map((f) => (
              // 读屏先读标签、再读数值，每项只读一次；视觉上仍是数值在上、标签在下
              <div key={f.label} className="flex flex-col-reverse rounded-xl border border-line-soft bg-white px-4 py-3">
                <dt className="mt-0.5 text-xs leading-snug text-muted">{f.label}</dt>
                <dd className="text-xl font-bold text-ink">{f.value}</dd>
              </div>
            ))}
          </dl>
          <nav aria-label="首页内容导航" className="rounded-xl border border-line-soft bg-white p-4">
            <p className="field-label">本页内容</p>
            <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
              {PAGE_NAV.map((n) => (
                <li key={n.id}>
                  <a href={`#${n.id}`} className="text-ink-soft hover:text-brand-strong">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </section>
  );
}
