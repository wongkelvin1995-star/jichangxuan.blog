import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/SectionHeading";
import { JsonLd } from "@/components/seo/JsonLd";
import { getBrand } from "@/lib/brands";
import { formatDate } from "@/lib/format";
import { HOME_RANKING, RANKING_UPDATED_AT } from "@/lib/ranking";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "测评方法与推荐榜排序原则：资料核实、测速记录与评价标准",
  description: "机场优选如何核实套餐资料、怎样执行与记录节点测试、按哪些标准描述品牌，以及首页推荐榜如何排序：编辑推荐顺序，包含推广合作因素，不是测速或评分排名。",
  path: "/methodology/",
});

export default function MethodologyPage() {
  const crumbs = [{ name: "测评方法", path: "/methodology/" }];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <PageHeader
        kicker="Methodology"
        title="测评方法与推荐榜排序原则"
        description="资料优先、禁止虚构：套餐信息只来自可追溯的资料，测速数值只来自有日期、注明出口节点的测试记录（本地网络环境与工具写到资料能提供的程度）；首页推荐榜的名次是编辑推荐顺序，不是测速或评分结果。"
      >
        <Breadcrumbs items={crumbs} className="mt-6" />
      </PageHeader>
      <div className="container-x max-w-[760px] py-10 md:py-14">
        <div className="prose-article">
          <h2 id="sources">套餐与品牌资料怎么核实</h2>
          <ol>
            <li>
              <strong>资料来源登记</strong>：每个品牌的价格、流量、节点数、优惠码、客服政策只来自站长提供的品牌资料，登记资料类型与整理日期。品牌宣传文案单独标注，不作为事实依据。
            </li>
            <li>
              <strong>逐项录入</strong>：只录入资料明确写出的数字；资料没有写的字段保持为空，页面显示“待核实”，不用相近品牌或行业均值填充。
            </li>
            <li>
              <strong>计算值单独标注</strong>：月均价格、每 GB 单价由本站按资料价格计算，页面注明“本站计算”，与品牌公布的数据区分。
            </li>
            <li>
              <strong>两种价格状态</strong>：
              <ul>
                <li>
                  <strong>价格已核对</strong>：站长在品牌官网或用户后台逐个核对套餐价格，与页面数据一致，页面显示核对日期。2026-11-25 起，品牌资料库收录的 20 个品牌都是这一状态（灵动云的资料曾于 2026-11-09 与资料原文逐项核对，价格于 2026-11-25 在官网或用户后台核对）。核对只针对价格，不是测速或解锁测试，也不等于本站下单验证；价格可能变动，购买前以官网结算页为准。
                </li>
                <li>
                  <strong>原稿参考价</strong>：站长转交的品牌资料原稿里的价格，还没有在品牌官网或用户后台核对，页面显示资料日期。目前没有品牌处于这一状态；以后新收录、尚未核对价格的品牌会这样标注。
                </li>
              </ul>
            </li>
            <li>
              <strong>资料冲突</strong>：原稿与公开资料、宣传文案说法不一致的字段，列在品牌页的“资料核验与矛盾”里，以原稿或站长的补充说明为准，并写明取舍理由。
            </li>
          </ol>

          <h2 id="speedtest">测速数据怎么获取</h2>
          <p>目前本站只有灵动云的测试记录，来源有三种，页面上会明确区分：</p>
          <ul>
            <li>
              <strong>站长实测</strong>：站长在自己的网络环境下使用测速工具与客户端完成测试，并提供报告图或截图；编辑部转录数值，不改动。
            </li>
            <li>
              <strong>站长提供的工具截图</strong>：例如节点检测工具的输出截图，本站按截图转录；截图中的订阅标识会脱敏。
            </li>
            <li>
              <strong>文字记录</strong>：品牌资料中附带的文字测试记录，没有截图可核对。页面上标注“文字记录（无截图）”，不与实测混用。
            </li>
          </ul>
          <p>每份记录都包含以下字段，缺少任何一项都会在页面上写明：</p>
          <ul>
            <li>测试时间（北京时间，精确到分钟）与所处时段（例如晚高峰）。</li>
            <li>本地网络环境（运营商、城市，资料未注明则写“未注明”）。</li>
            <li>测速工具与版本、测试的节点与出口地区。</li>
            <li>方法概述：连接方式、测试项目、读数来自哪里。</li>
            <li>局限：单次测试、未计入的节点、与其他记录不能直接比较的原因。</li>
          </ul>
          <p>
            首页推荐榜上的其他 11 家品牌目前没有本站测试记录，品牌页上的速度、稳定性、流媒体与 AI 工具可用性都标注为品牌说法。想自己测，可以按
            <Link href="/speedtest/peak-hour-stability-guide/">晚高峰变慢怎么办</Link>里的自测方法和记录模板操作。
          </p>

          <h3 id="how-to-test">推荐的自测方法</h3>
          <ol>
            <li>固定时段：分别在白天与晚高峰（20:00–23:00）各测一次，记录时间。</li>
            <li>先测本地宽带：关闭代理，用测速网站测一次，作为上限参考。</li>
            <li>再测节点：在客户端里连接目标节点，用同一个测速网站测下载、上传与延迟；换 2–3 个同地区节点重复。</li>
            <li>连通性：用 IPCheck.ing 一类的检测页查看常用服务是否可用，以及服务判定的出口地区。</li>
            <li>实际体验：打开 YouTube 播放一段视频，在“详细统计信息”里看连接速度与丢帧，比单纯的下载数字更接近真实使用。</li>
            <li>记录环境：运营商、城市、设备、客户端版本一起记下来，否则结果没有参考价值。</li>
          </ol>

          <h2 id="criteria">品牌评价标准</h2>
          <p>
            本站不给品牌打分，也不发布测速或评分排名。品牌页与测评只围绕以下可核查的维度描述事实，并写明资料日期。首页推荐榜的排序方式单独说明，见下一节“推荐榜排序原则”。
          </p>
          <ul>
            <li>
              <strong>线路与节点</strong>：线路类型（IEPL / IPLC / BGP 等）、地区与节点数、倍率是否公开。
            </li>
            <li>
              <strong>套餐透明度</strong>：价格、流量、周期、重置规则、重置包价格、长周期折扣是否写清楚。
            </li>
            <li>
              <strong>设备与客户端</strong>：同时在线设备数、是否提供官方客户端、是否支持第三方客户端及其条件。
            </li>
            <li>
              <strong>客服与政策</strong>：客服渠道、响应时间、退款与试用政策、下载渠道是否只限官网。
            </li>
            <li>
              <strong>测试记录</strong>：有无站长实测、测试的时段与环境、结果的局限。
            </li>
            <li>
              <strong>适合人群</strong>：根据流量档位与使用方式给出的编辑建议，明确标注为建议而非事实。
            </li>
          </ul>

          <h2 id="ranking">推荐榜排序原则</h2>
          <p>
            首页的“2026 热门机场推荐排行榜”是机场优选的<strong>编辑推荐顺序</strong>，包含推广合作因素，不是测速、性能或评分排名。上榜 {HOME_RANKING.length} 家均与本站存在推广合作，通过本站链接购买，本站可能获得佣金。榜单 2026-11-16 定为七家，2026-11-25 由站长调整为 12 家并改了顺序。
          </p>
          <p>当前顺序（{formatDate(RANKING_UPDATED_AT)} 起）：</p>
          <ol>
            {HOME_RANKING.map((r) => {
              const b = getBrand(r.brandId);
              return (
                <li key={r.brandId}>
                  {b ? <Link href={b.hubPath ?? `/brands/${b.slug}/`}>{r.displayName}</Link> : r.displayName}
                </li>
              );
            })}
          </ol>
          <p>排序由站长与编辑部决定，参考这些因素：</p>
          <ul>
            <li>资料是否完整：套餐、节点、线路、客户端、客服与退款政策写清楚了多少。</li>
            <li>价格状态：是否已经核对（2026-11-25 起上榜品牌的价格都已由站长在官网或后台核对）。</li>
            <li>是否有本站测试记录（目前只有灵动云）。</li>
            <li>客户端与使用门槛：是否提供官方客户端、能否用第三方客户端、设备与流量规则是否清楚。</li>
            <li>推广合作关系：上榜品牌都是推广合作品牌，合作是排序因素之一。</li>
          </ul>
          <p>
            顺序由人工设定，不会自动排序或随机切换；每次调整都会写进<Link href="/updates/">更新记录</Link>。名次不代表某家机场在你的网络环境下更快或更稳定，购买前请先看品牌页的资料状态，并用月付或最小档自测。
          </p>

          <h2 id="update">内容更新机制</h2>
          <ul>
            <li>套餐数据变更：更新数据文件与日期，相关页面的“更新于”日期同步修改，并在页面的修改记录里写明变更内容。</li>
            <li>测试记录：发布后不修改测得的数值（转录错误的更正除外，更正写进该页的修改记录）；新的测试另写新记录。</li>
            <li>教程：客户端界面或步骤变化后更新正文与“更新于”日期。</li>
            <li>纠错：读者指出的错误核实后修正，并在页面里注明修改内容；全站的实质修改汇总在更新记录页。</li>
          </ul>

          <h2 id="limits">目前的局限</h2>
          <ul>
            <li>测试记录数量有限，只有灵动云；其他品牌的价格于 2026-11-25 由站长在品牌官网或用户后台核对，但节点、设备、客户端政策等其他资料仍是品牌资料的说法，未经本站测试。</li>
            <li>站长实测报告未注明本地接入运营商与城市，只注明时间与出口节点，不应视为某个地区或运营商的代表性结果。</li>
            <li>本站没有韩国、欧洲节点的测试记录，相关地区只提供一般性知识。</li>
          </ul>
          <p>
            本站与品牌的商业关系见<Link href="/disclosure/">商业关系披露</Link>。
          </p>
        </div>
      </div>
    </>
  );
}
