import type { Metadata } from "next";
import Link from "next/link";

import { BrandCard } from "@/components/brand/BrandCard";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/SectionHeading";
import { JsonLd } from "@/components/seo/JsonLd";
import { StatusBadge } from "@/components/ui/Badge";
import { brandPath, getPublishedBrands } from "@/lib/brands";
import { HOME_RANKING } from "@/lib/ranking";
import { breadcrumbJsonLd, buildMetadata, itemListJsonLd } from "@/lib/seo";

const brands = getPublishedBrands();
const rankedIds = new Set(HOME_RANKING.map((r) => r.brandId));
const ranked = HOME_RANKING.map((r) => brands.find((b) => b.id === r.brandId)).filter((b): b is (typeof brands)[number] => !!b);
const others = brands.filter((b) => !rankedIds.has(b.id));

export const metadata: Metadata = buildMetadata({
  title: `机场品牌资料库：${brands.length} 个机场的套餐、节点与客户端政策`,
  description: `收录 ${brands.length} 个机场品牌的资料页：套餐价格（2026-11-25 已核对）、节点地区、线路类型、设备与客户端政策、优惠码、客服与退款政策；前 ${HOME_RANKING.length} 家按首页编辑推荐顺序排列，均注明资料日期，不显示评分。`,
  path: "/brands/",
});

export default function BrandsPage() {
  const crumbs = [{ name: "品牌资料库", path: "/brands/" }];
  const verified = brands.filter((b) => b.dataStatus === "verified").length;
  const reference = brands.filter((b) => b.dataStatus === "reference").length;
  const ordered = [...ranked, ...others];
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          itemListJsonLd({
            name: "机场品牌资料库",
            description: `${brands.length} 个机场品牌的资料页；前 ${HOME_RANKING.length} 家按首页编辑推荐顺序排列（含推广合作因素，不是测速或评分排名）`,
            path: "/brands/",
            items: ordered.map((b) => ({ name: b.name, path: brandPath(b) })),
          }),
        ]}
      />
      <PageHeader
        kicker="Brands"
        title="机场品牌资料库"
        description={`${brands.length} 个品牌。前 ${HOME_RANKING.length} 家按首页推荐榜的编辑推荐顺序排列（含推广合作因素，不是测速或评分排名），其余按收录顺序排列。每个品牌页列出套餐价格、节点、线路、设备与客户端政策、优惠码与客服政策，并注明资料日期、核实状态、资料缺口与矛盾。`}
      >
        <Breadcrumbs items={crumbs} className="mt-6" />
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
          <span className="inline-flex items-center gap-2">
            <StatusBadge kind="verified" /> {verified} 个：价格由站长在品牌官网或用户后台核对
          </span>
          {reference > 0 && (
            <span className="inline-flex items-center gap-2">
              <StatusBadge kind="reference" /> {reference} 个：价格来自站长提供的资料原稿，尚未核对
            </span>
          )}
        </div>
      </PageHeader>
      <div className="container-x py-10 md:py-14">
        <div className="mb-10 rounded-2xl border border-line bg-white p-5 text-sm text-ink-soft">
          <p className="font-semibold text-ink">怎么读这些资料页</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>“价格已核对”指价格于 2026-11-25 由站长在品牌官网或用户后台核对，购买前以官网结算页为准；这不是测速或解锁测试，节点、设备、客户端等其他资料仍是品牌资料的说法。</li>
            <li>资料没写的字段显示“待核实”；原稿与公开资料冲突的字段列在“资料核验与矛盾”里，本站不把它们当作事实。</li>
            <li>“流媒体与 AI”“原生 IP”“晚高峰不降速”等都是品牌资料的说法，没有本站测试记录的不作为推荐依据。</li>
            <li>
              所有品牌的购买链接都是推广链接：通过它购买，本站可能获得佣金，你支付的价格不变。关系说明见
              <Link href="/disclosure/" className="ml-1 text-brand-strong underline underline-offset-2">
                商业关系披露
              </Link>
              ；想横向比价请用
              <Link href="/compare/" className="ml-1 text-brand-strong underline underline-offset-2">
                套餐比较表
              </Link>
              。
            </li>
          </ul>
        </div>

        <section aria-labelledby="ranked-brands-title">
          <h2 id="ranked-brands-title" className="section-title">
            首页推荐榜 {HOME_RANKING.length} 家
          </h2>
          <p className="section-desc">
            顺序与
            <Link href="/#ranking" className="mx-0.5 text-brand-strong underline underline-offset-2">
              首页 2026 推荐排行榜
            </Link>
            一致，是编辑推荐顺序，排序原则见
            <Link href="/methodology/#ranking" className="mx-0.5 text-brand-strong underline underline-offset-2">
              测评方法
            </Link>
            。
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ranked.map((b) => (
              <BrandCard key={b.id} brand={b} headingLevel="h3" />
            ))}
          </div>
        </section>

        {others.length > 0 && (
          <section className="mt-14" aria-labelledby="other-brands-title">
            <h2 id="other-brands-title" className="section-title">
              其他收录品牌
            </h2>
            <p className="section-desc">这些品牌暂未写编辑正文，资料页列出站长提供的套餐与政策资料（价格已核对），本站没有它们的测试记录。</p>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {others.map((b) => (
                <BrandCard key={b.id} brand={b} headingLevel="h3" />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
