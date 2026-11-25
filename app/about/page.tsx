import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/SectionHeading";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPublishedBrands } from "@/lib/brands";
import { getPublishedArticles } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { AUTHORS, CATEGORIES, SITE } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "关于机场优选：内容来源、作者、更新机制与推广披露",
  absoluteTitle: true,
  description: "机场优选（JichangXuan）是简体中文机场推荐与教程博客：为什么做这个站、谁在维护、资料与测试从哪里来、内容怎么更新，以及与推荐品牌的推广合作关系。",
  path: "/about/",
});

export default function AboutPage() {
  const author = AUTHORS.editorial;
  const count = getPublishedArticles().length;
  const crumbs = [{ name: "关于", path: "/about/" }];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <PageHeader kicker="About" title="关于机场优选" description={SITE.description}>
        <Breadcrumbs items={crumbs} className="mt-6" />
      </PageHeader>
      <div className="container-x max-w-[760px] py-10 md:py-14">
        <div className="prose-article">
          <h2 id="purpose">为什么做这个站</h2>
          <p>
            “机场”相关的信息大多散落在论坛、群组和各家官网里，价格随时在变，速度又和每个人的网络环境有关。机场优选想做的事很简单：把挑选机场需要看的信息放到一个地方，并且把每条信息的来源和日期写清楚。
          </p>
          <ul>
            <li>帮读者按自己的需求与预算选择机场和套餐，而不是按广告词选择。</li>
            <li>把套餐条款、流量规则、设备与客户端政策、退款方式这些容易被忽略的内容整理出来。</li>
            <li>记录有日期、注明出口节点与局限的节点测试，供读者参考，而不是替读者下结论。</li>
            <li>提供 Windows、Android、iOS 与 Clash 客户端的使用教程与故障排查方法。</li>
          </ul>
          <p>
            首页推荐榜上的 12 家、以及<Link href="/brands/">品牌资料库</Link>中的品牌都与本站存在推广合作，推荐顺序包含推广合作因素。我们不是独立第三方测评机构，也不会把自己包装成那样；相关关系在
            <Link href="/disclosure/">商业关系披露</Link>页完整说明，排序方式见<Link href="/methodology/#ranking">推荐榜排序原则</Link>。
          </p>

          <h2 id="who">谁在维护</h2>
          <ul>
            <li>
              <strong>站长</strong>（部分旧页面写作“站主”）：机场优选的所有者与运营者，负责与品牌沟通合作，提供品牌资料原稿，并在自己的网络环境下完成节点测试、提供报告图或截图。
            </li>
            <li>
              <strong>编辑部</strong>：整理资料、核对数据、转录测试记录并撰写文章与教程，文章统一署名“{author.name}”。
            </li>
            <li>
              <strong>品牌资料中附带的文字记录</strong>：品牌资料里附带的测试文字，不是本站做的测试，页面标注为“文字记录（无截图）”。
            </li>
          </ul>

          <h2 id="author">作者信息</h2>
          <div className="not-prose rounded-2xl border border-line bg-white p-5">
            <p className="text-lg font-bold text-ink">{author.name}</p>
            <p className="mt-1 text-sm text-muted">{author.role}</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{author.bio}</p>
          </div>
          <ul>
            <li>负责范围：品牌资料整理与核对、套餐比较、测试记录转录、客户端教程与故障排查文章。</li>
            <li>测试方式：节点测试由站长完成，编辑部只转录报告里的数值，并写明测试时间、出口节点、工具和局限；没有测试的品牌不写速度结论。</li>
            <li>利益关系：本站通过推广链接获得收入，上榜品牌均为推广合作品牌；这层关系写在每个相关页面上。</li>
            <li>个人署名：站长确定公开署名后会在这里补充，文章署名同步更新。</li>
          </ul>

          <h2 id="update">内容更新机制</h2>
          <ul>
            <li>
              <strong>套餐与政策</strong>：以站长提供的品牌资料为准，每条数据标注核对日期或资料日期；价格由站长在品牌官网或用户后台核对（最近一次 2026-11-25），购买前以官网结算页为准；品牌调价或改规则后，更新数据和日期，并在页面的修改记录里写明改了什么，不做静默修改。
            </li>
            <li>
              <strong>测试记录</strong>：每份记录注明测试时间与出口节点，网络环境、工具与方法写到资料能提供的程度，缺的项标“未注明”；发布后不改动测得的数值（转录错误的更正除外，更正会写进该页的修改记录），新的测试另写一份记录，不覆盖旧记录。
            </li>
            <li>
              <strong>教程</strong>：客户端版本变化导致步骤不同时更新正文，并修改文章的“更新于”日期。
            </li>
            <li>
              <strong>草稿</strong>：资料不完整或尚未核实的文章保持草稿状态，不公开、不进入 sitemap，核实后才发布。
            </li>
          </ul>
          <p>
            本站内容建立于 {formatDate(SITE.launchedAt)}，目前已发布 {count} 篇文章。全站的实质修改按日期列在<Link href="/updates/">更新记录</Link>里，页脚显示全站最近更新日期。
          </p>

          <h2 id="sections">栏目说明</h2>
          <ul>
            {CATEGORIES.map((c) => (
              <li key={c.id}>
                <Link href={c.path}>{c.label}</Link>：{c.short}。
              </li>
            ))}
            <li>
              <Link href="/brands/">品牌资料库</Link>：{getPublishedBrands().length} 个品牌的套餐、节点与客户端政策资料页。
            </li>
          </ul>

          <h2 id="principles">我们不做的事</h2>
          <ul>
            <li>不编造评分、测速排名、用户好评、运营商数据或速度承诺；首页推荐榜是写明了依据的编辑推荐顺序，不是测速结果。</li>
            <li>不把没做过的测试写成已完成，不用估算数据填充空白字段。</li>
            <li>不隐藏推广关系，不做伪装成独立评测的广告页。</li>
            <li>不提供需要读者上传订阅链接的在线工具。</li>
          </ul>

          <h2 id="contact">联系与纠错</h2>
          <p>
            发现资料过期、数字错误或链接失效，纠错方式见<Link href="/contact/">联系与纠错</Link>页；测速方法与评价标准见<Link href="/methodology/">测评方法</Link>。
          </p>
        </div>
      </div>
    </>
  );
}
