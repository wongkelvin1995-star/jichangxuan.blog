import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/SectionHeading";
import { JsonLd } from "@/components/seo/JsonLd";
import { brandPath, dataStatusLabel, getBrand, getPublishedBrands } from "@/lib/brands";
import { formatDate } from "@/lib/format";
import { HOME_RANKING, RANKING_UPDATED_AT } from "@/lib/ranking";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "商业关系披露：推广合作、推荐榜与推广链接说明",
  description: "首页推荐榜 12 家与品牌资料库中的品牌均与机场优选存在推广合作。本页说明推荐顺序如何受合作影响、推广链接怎么标注、各品牌的价格状态，以及内容独立性原则。",
  path: "/disclosure/",
});

export default function DisclosurePage() {
  const crumbs = [{ name: "商业关系披露", path: "/disclosure/" }];
  const brands = getPublishedBrands();
  const sponsored = brands.filter((b) => b.relationship === "sponsored").length;
  const rankedIds = new Set(HOME_RANKING.map((r) => r.brandId));
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <PageHeader kicker="Disclosure" title="商业关系披露" description="我们把推广关系写在显眼的位置，而不是藏在页脚；读者可以据此判断每条推荐的分量。">
        <Breadcrumbs items={crumbs} className="mt-6" />
      </PageHeader>
      <div className="container-x max-w-[760px] py-10 md:py-14">
        <div className="prose-article">
          <h2 id="summary">一句话说明</h2>
          <p>
            机场优选通过推广链接获得收入：读者通过本站链接注册或购买，本站可能获得佣金，读者支付的价格不会因此提高。品牌资料库收录的 {sponsored} 个品牌（包括首页推荐榜上的 {HOME_RANKING.length} 家）都与本站存在推广合作。
          </p>

          <h2 id="ranking">首页推荐榜与上榜品牌</h2>
          <p>
            首页“2026 热门机场推荐排行榜”是编辑推荐顺序，包含推广合作因素，不是测速、性能或评分排名。顺序从 {formatDate(RANKING_UPDATED_AT)} 起固定为下表，排序考虑的因素写在
            <Link href="/methodology/#ranking">推荐榜排序原则</Link>。
          </p>
          <div className="table-wrap not-prose">
            <table>
              <thead>
                <tr>
                  <th scope="col">名次</th>
                  <th scope="col">品牌</th>
                  <th scope="col">商业关系</th>
                  <th scope="col">价格状态</th>
                  <th scope="col">核对日期</th>
                </tr>
              </thead>
              <tbody>
                {HOME_RANKING.map((r) => {
                  const b = getBrand(r.brandId);
                  if (!b) return null;
                  return (
                    <tr key={r.brandId}>
                      <td>{r.rank}</td>
                      <td>
                        <Link href={brandPath(b)} className="text-brand-strong underline underline-offset-2">
                          {r.displayName}
                        </Link>
                      </td>
                      <td>{b.relationship === "sponsored" ? "推广合作" : "无合作"}</td>
                      <td>{dataStatusLabel(b).label}</td>
                      <td className="whitespace-nowrap">{b.verifiedAt ?? b.materialDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p>
            上榜品牌的价格于 2026-11-25 由站长在品牌官网或用户后台核对，购买前以官网结算页为准；价格核对不是测速，上榜品牌里只有灵动云有本站的测试记录，其余品牌的速度、稳定性与流媒体、AI 工具可用性都是品牌说法。推荐榜在 2026-11-16 定为七家，2026-11-25 调整为现在的 12 家（新增大佬云、梯子云、无忧链接、Firefly、全球云，并调整顺序），调整记录见<Link href="/updates/">更新记录</Link>。
          </p>

          <h2 id="links">推广链接怎么标注</h2>
          <ul>
            <li>推广链接只在统一数据文件中维护，页面组件不会自行拼接或猜测地址；地址由站长提供。</li>
            <li>购买按钮上带“推广”小标签，按钮附近有一句话的披露；推广外链对搜索引擎标注为赞助链接（sponsored），在新标签页打开。</li>
            <li>文章正文的文字里不直接放推广链接，品牌名链接到本站的品牌资料页；部分文章带有品牌推荐卡片，卡片里的“官网注册”按钮是推广链接，按钮标“推广”，卡片底部有披露。</li>
            <li>优惠码由品牌提供，折扣以结算页显示为准；本站不保证优惠长期有效。</li>
          </ul>

          <h2 id="others">品牌资料库中的其他品牌</h2>
          <p>
            品牌资料库目前收录 {brands.length} 个品牌，其中 {sponsored} 个品牌页面上的购买链接是推广链接。榜单之外的品牌按收录顺序排列，没有名次；它们的价格同样于 2026-11-25 由站长在品牌官网或用户后台核对，节点、设备等其他资料仍按品牌资料整理，资料没写的字段显示“待核实”，原稿与公开资料冲突的字段列在各品牌页的“资料核验与矛盾”中。
          </p>
          <div className="table-wrap not-prose">
            <table>
              <thead>
                <tr>
                  <th scope="col">品牌</th>
                  <th scope="col">商业关系</th>
                  <th scope="col">价格状态</th>
                  <th scope="col">核对日期</th>
                </tr>
              </thead>
              <tbody>
                {brands
                  .filter((b) => !rankedIds.has(b.id))
                  .map((b) => (
                    <tr key={b.id}>
                      <td>
                        <Link href={brandPath(b)} className="text-brand-strong underline underline-offset-2">
                          {b.name}
                        </Link>
                      </td>
                      <td>{b.relationship === "sponsored" ? "推广合作" : "无合作"}</td>
                      <td>{dataStatusLabel(b).label}</td>
                      <td className="whitespace-nowrap">{b.verifiedAt ?? b.materialDate}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p>与品牌建立或结束合作时，本页与对应品牌页会同步更新；品牌调价或重新核对价格后，更新“价格已核对”的核对日期；新收录、尚未核对的品牌标“原稿参考价”。</p>

          <h2 id="independence">内容独立性原则</h2>
          <ul>
            <li>推广合作不改变事实：套餐价格、流量规则、测试结果按资料与记录如实写出，包括对品牌不利的部分（例如测试中上传速度低、资料缺口与矛盾）。</li>
            <li>不写虚假用户好评、速度承诺、运营商数据或“永久有效”的优惠；品牌资料里的速度、原生 IP 等宣传说法只放在“资料中的宣传性说法”里并标明未经测试，不作为结论；横向排名、运营年限等无法核实的说法不转载。</li>
            <li>不以“独立第三方测评”自居；文章署名是机场优选编辑部，并在文内说明合作关系。</li>
            <li>首页推荐榜的名次包含推广合作因素，所以它不是测评结论；测评与品牌页不打分。</li>
          </ul>

          <h2 id="where">披露出现的位置</h2>
          <ul>
            <li>首页推荐榜标题下方的说明，以及每张榜单卡片上的“推广合作”标签。</li>
            <li>首页灵动云模块、灵动云专区页首与购买入口模块。</li>
            <li>每个品牌页的页首、购买按钮与“资料来源与更新记录”。</li>
            <li>每篇涉及品牌的文章：信息面板中的“推广披露”与文内品牌推荐卡片底部。</li>
            <li>页脚的“商业关系披露”摘要，以及本页。</li>
          </ul>

          <h2 id="contact">对披露有疑问</h2>
          <p>
            如果你认为某处推广标注不清楚，或者某条信息与你了解的情况不符，纠错方式见<Link href="/contact/">联系与纠错</Link>页。
          </p>
        </div>
      </div>
    </>
  );
}
