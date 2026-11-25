import type { Metadata } from "next";
import { Mail } from "lucide-react";
import Link from "next/link";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/SectionHeading";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "联系与纠错",
  description: "向机场优选反馈资料错误、链接失效、价格变动或提供新的测试记录。说明我们处理纠错的流程，以及提供资料时需要附上的信息。",
  path: "/contact/",
});

export default function ContactPage() {
  const crumbs = [{ name: "联系与纠错", path: "/contact/" }];
  const email = SITE.contactEmail;
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <PageHeader kicker="Contact" title="联系与纠错" description="资料会过期，数字可能抄错，链接也会失效。看到问题请告诉我们，核实后会尽快修正并注明。">
        <Breadcrumbs items={crumbs} className="mt-6" />
      </PageHeader>
      <div className="container-x max-w-[760px] py-10 md:py-14">
        <div className="not-prose rounded-2xl border border-line bg-white p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Mail size={20} aria-hidden="true" className="text-brand" />
            联系邮箱
          </h2>
          {email ? (
            <p className="mt-2 text-ink-soft">
              <a href={`mailto:${email}`} className="font-semibold text-brand-strong underline underline-offset-2">
                {email}
              </a>
              。邮件主题请以“纠错”“资料”或“合作”开头，方便分类处理。
            </p>
          ) : (
            <p className="mt-2 text-ink-soft">纠错邮箱正在开通，开通后会显示在这里和页脚。在此之前暂时没有可用的联系渠道，我们会定期自查资料日期与链接。</p>
          )}
        </div>
        <div className="prose-article mt-8">
          <h2 id="errata">纠错流程</h2>
          <ol>
            <li>在邮件里写明页面地址、有问题的具体内容（引用原句或截图）以及你认为正确的信息和依据。</li>
            {email ? (
              <>
                <li>我们在 3 个工作日内回复是否受理；需要向品牌核实的内容会标注“核实中”。</li>
                <li>核实后 7 天内修正页面，修改“更新于”日期，并在页面的修改记录里注明修改内容；错误明显的会同步撤下相关推荐。</li>
              </>
            ) : (
              <li>核实后修正页面，修改“更新于”日期，并在页面的修改记录与全站更新记录里注明修改内容。</li>
            )}
          </ol>

          <h2 id="materials">提供品牌资料或测试记录</h2>
          <p>欢迎提供新的品牌资料或测试记录。为了能被采用，请一并附上：</p>
          <ul>
            <li>资料来源（官网页面、客服答复截图等）与获取日期。</li>
            <li>测试记录的时间（精确到分钟）、本地运营商与城市、测速工具与版本、所测节点。</li>
            <li>截图请保留工具自带的时间戳；订阅链接、账号等敏感信息请先打码。</li>
          </ul>
          <p>他人提供的记录发布时会写明来源，不会写成本站实测；采用与否由编辑决定。</p>

          <h2 id="cooperation">品牌合作</h2>
          <p>
            本站与首页推荐榜上的 12 家及品牌资料库中的品牌存在推广合作，关系说明见<Link href="/disclosure/">商业关系披露</Link>。其他品牌如希望提供资料或洽谈合作，请注明品牌名称与联系方式；合作不影响本站如实记录套餐与测试结果。
          </p>

          <h2 id="not">我们不处理的事项</h2>
          <ul>
            <li>不代为处理任何品牌的账号、退款或客服问题，请直接联系对应品牌。</li>
            <li>不接收订阅链接、账号密码等敏感信息。</li>
          </ul>
        </div>
      </div>
    </>
  );
}
