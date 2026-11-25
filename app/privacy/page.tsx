import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/SectionHeading";
import { JsonLd } from "@/components/seo/JsonLd";
import { formatDate } from "@/lib/format";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { SITE, STATIC_PAGES } from "@/lib/site";

/** 页面日期与 sitemap lastmod 同源（lib/site.ts STATIC_PAGES） */
const PRIVACY_UPDATED = STATIC_PAGES.find((p) => p.path === "/privacy/")?.lastmod ?? SITE.launchedAt;

export const metadata: Metadata = buildMetadata({
  title: "隐私说明",
  description: "机场优选不设账号系统、不投放广告追踪脚本；说明托管服务可能记录的访问日志、浏览器本地存储的使用、推广链接与外部链接，以及读者来信的处理方式。",
  path: "/privacy/",
});

export default function PrivacyPage() {
  const crumbs = [{ name: "隐私说明", path: "/privacy/" }];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <PageHeader kicker="Privacy" title="隐私说明" description="本站是静态博客，不需要注册，也不收集个人资料。下面说明我们实际会接触到的数据。">
        <Breadcrumbs items={crumbs} className="mt-6" />
      </PageHeader>
      <div className="container-x max-w-[760px] py-10 md:py-14">
        <div className="prose-article">
          <h2 id="collect">我们收集什么</h2>
          <ul>
            <li>
              <strong>不设账号</strong>：本站没有注册、登录、评论或表单提交功能，不会要求你提供姓名、邮箱或订阅链接。
            </li>
            <li>
              <strong>访问日志</strong>：托管服务商（网站所在的服务器或 CDN）可能按其政策记录访问时间、IP 地址、浏览器类型等用于安全与统计的日志。本站不额外收集。
            </li>
            <li>
              <strong>统计脚本</strong>：目前没有接入任何第三方统计或广告追踪脚本。若未来接入，会在本页更新并说明用途。
            </li>
          </ul>

          <h2 id="storage">浏览器本地存储</h2>
          <p>站内搜索在你的浏览器里加载一份静态索引文件完成匹配，匹配过程不需要服务器参与；不过搜索词会出现在地址栏里，刷新页面或分享链接时，它可能随请求出现在托管服务的访问日志中。本站目前不使用 Cookie 或本地存储记录你的偏好。</p>

          <h2 id="links">外部链接</h2>
          <p>
            指向品牌官网的链接会离开本站，对方网站有自己的隐私政策。购买按钮使用的是推广链接：链接带有本站的邀请码或专属入口地址，品牌方会据此记录你是从本站进入的，用于结算佣金；本站拿不到你在品牌网站上的账号或付款信息。推广链接的说明见
            <Link href="/disclosure/">商业关系披露</Link>。本站不提供任何需要你上传订阅链接、账号或配置文件的在线工具。
          </p>

          <h2 id="mail">读者来信</h2>
          <p>你通过邮件发来的纠错或资料，只用于核实与修正内容；不会公开你的邮箱，也不会用于营销。发布他人提供的测试记录时，会去除截图中的订阅标识等敏感信息。</p>

          <h2 id="changes">变更</h2>
          <p>
            本页最近更新于 <time dateTime={PRIVACY_UPDATED}>{formatDate(PRIVACY_UPDATED)}</time>；内容变更时会更新这个日期，并写进<Link href="/updates/">更新记录</Link>。
            {SITE.contactEmail ? (
              <>
                对隐私有疑问，请通过<Link href="/contact/">联系与纠错</Link>页联系我们。
              </>
            ) : (
              <>
                纠错与联系邮箱开通后会公布在<Link href="/contact/">联系与纠错</Link>页。
              </>
            )}
          </p>
        </div>
      </div>
    </>
  );
}
