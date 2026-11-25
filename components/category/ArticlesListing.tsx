import Link from "next/link";

import { ArticleList } from "@/components/article/ArticleList";
import { Pagination } from "@/components/article/Pagination";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/SectionHeading";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPublishedArticles, paginate, toSummary } from "@/lib/content";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { ARTICLES_PER_PAGE, CATEGORIES } from "@/lib/site";

export function ArticlesListing({ page }: { page: number }) {
  const all = getPublishedArticles();
  const { items, totalPages, total } = paginate(all, page, ARTICLES_PER_PAGE);
  const summaries = items.map(toSummary);
  const path = page > 1 ? `/articles/page/${page}/` : "/articles/";
  const crumbs = page > 1 ? [{ name: "全部文章", path: "/articles/" }, { name: `第 ${page} 页`, path }] : [{ name: "全部文章", path }];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          itemListJsonLd({
            name: page > 1 ? `全部文章（第 ${page} 页）` : "全部文章",
            path,
            items: summaries.map((a) => ({ name: a.title, path: a.path })),
          }),
        ]}
      />
      <PageHeader
        kicker="Articles"
        title={page > 1 ? `全部文章（第 ${page} 页）` : "全部文章"}
        description={`已发布 ${total} 篇，按发布日期倒序排列，每页 ${ARTICLES_PER_PAGE} 篇。也可以按栏目或标签浏览。`}
      >
        <Breadcrumbs items={crumbs} className="mt-6" />
        <ul className="mt-5 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <Link href={c.path} className="chip hover:bg-sky">
                {c.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/tags/" className="chip chip-outline hover:border-brand hover:text-brand-strong">
              按标签浏览
            </Link>
          </li>
        </ul>
      </PageHeader>
      <div className="container-x py-10 md:py-14">
        <ArticleList articles={summaries} />
        <Pagination basePath="/articles/" page={page} totalPages={totalPages} />
      </div>
    </>
  );
}
