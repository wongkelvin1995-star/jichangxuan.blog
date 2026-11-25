import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/SectionHeading";
import { JsonLd } from "@/components/seo/JsonLd";
import { CHANGELOG } from "@/lib/changelog";
import { getPublishedArticles } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "更新记录：站点改版、品牌资料与文章更正",
  description: "机场优选按日期倒序列出的实质修改：站点与首页改版、品牌资料与价格状态变化、新增文章与文章更正。每条写明改了什么，不做静默修改。",
  path: "/updates/",
});

export default function UpdatesPage() {
  const crumbs = [{ name: "更新记录", path: "/updates/" }];
  // 文章自己的修改记录（frontmatter.changes）一并列出，方便读者核对
  const articleChanges = getPublishedArticles()
    .flatMap((a) => (a.frontmatter.changes ?? []).map((c) => ({ ...c, title: a.frontmatter.title, path: a.path })))
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, "zh-CN"));
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <PageHeader kicker="Updates" title="更新记录" description="只记录实质修改：改了哪些页面、改了什么。价格、节点、客户端政策与测试记录的变化都会写在这里和对应页面的修改记录里。">
        <Breadcrumbs items={crumbs} className="mt-6" />
      </PageHeader>
      <div className="container-x max-w-[760px] py-10 md:py-14">
        <div className="prose-article">
          <h2 id="site">全站更新</h2>
          {CHANGELOG.map((c, i) => (
            <section key={c.date + c.title} aria-labelledby={`log-${c.date}-${i}`}>
              <h3 id={`log-${c.date}-${i}`}>
                <time dateTime={c.date}>{formatDate(c.date)}</time>：{c.title}
              </h3>
              <ul>
                {c.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {c.paths?.length ? (
                <p className="text-sm">
                  涉及页面：
                  {c.paths.map((p, i) => (
                    <span key={p}>
                      <Link href={p}>{p === "/" ? "首页" : p}</Link>
                      {i < c.paths!.length - 1 ? "、" : ""}
                    </span>
                  ))}
                </p>
              ) : null}
            </section>
          ))}

          {articleChanges.length > 0 && (
            <>
              <h2 id="articles">文章修改记录</h2>
              <ul>
                {articleChanges.map((c) => (
                  <li key={c.path + c.date + c.note}>
                    <time dateTime={c.date}>{formatDate(c.date)}</time> · <Link href={c.path}>{c.title}</Link>：{c.note}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2 id="how">记录规则</h2>
          <ul>
            <li>价格或套餐变化：更新品牌页的资料日期或核对日期，并在这里写明涉及的品牌。</li>
            <li>测试记录发布后不改数值；新的测试另写一篇。</li>
            <li>文章更正：在文章的修改记录里写明改了什么，并更新“更新于”日期。</li>
            <li>
              首页推荐榜顺序调整也会记录在这里，排序原则见<Link href="/methodology/#ranking">测评方法</Link>。
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
