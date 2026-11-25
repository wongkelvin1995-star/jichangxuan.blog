import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { ArticleList } from "@/components/article/ArticleList";
import { Pagination } from "@/components/article/Pagination";
import { NeedsDirectory } from "@/components/category/NeedsDirectory";
import { ReviewsGrid } from "@/components/category/ReviewsGrid";
import { RegionGrid, type RegionReportLink } from "@/components/home/RegionsSection";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/SectionHeading";
import { JsonLd } from "@/components/seo/JsonLd";
import { categoryPerPage, getArticlesByCategory, getSpeedtestReportsByRegion, paginate, toSummary } from "@/lib/content";
import { getOrderedReviews, REVIEW_FILTERS } from "@/lib/reviews";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { TUTORIAL_ENTRIES } from "@/lib/site";
import type { CategoryMeta } from "@/lib/types";

function SpeedtestExtras() {
  const reports: Record<string, RegionReportLink[]> = {};
  for (const [region, list] of getSpeedtestReportsByRegion()) {
    reports[region] = list.map((a) => ({ title: a.frontmatter.title, path: a.path, testedAt: a.frontmatter.test!.testedAt.slice(0, 10) }));
  }
  return (
    <section className="mb-14" aria-labelledby="regions-grid-title">
      <h2 id="regions-grid-title" className="section-title">
        按地区查看
      </h2>
      <p className="section-desc">
        每个地区列出本站现有的测试记录。没有记录的地区只提供一般性知识，不显示估算或推测的数值。测速方法见
        <Link href="/methodology/" className="ml-1 text-brand-strong underline underline-offset-2">
          测评方法
        </Link>
        。
      </p>
      <div className="mt-6">
        <RegionGrid reports={reports} />
      </div>
    </section>
  );
}

function GuidesExtras() {
  return (
    <section className="mb-10" aria-label="按系统选择教程">
      <ul className="flex flex-wrap gap-2">
        {TUTORIAL_ENTRIES.map((t) => (
          <li key={t.slug}>
            <Link href={`/guides/${t.slug}/`} className="chip hover:bg-sky">
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReviewsExtras() {
  return (
    <section className="mb-10 rounded-2xl border border-line bg-white p-5 text-sm text-ink-soft" aria-label="测评原则">
      <p className="font-semibold text-ink">我们怎么写测评</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>只依据站长提供的品牌资料和有日期的测试记录，不打分，不编造用户评价；首页推荐榜的名次是编辑推荐顺序（含推广合作因素），不是测评结论。</li>
        <li>灵动云的测评引用本站带日期的测试记录；其余品牌是资料分析型测评，不写测速、延迟、丢包或解锁成功率数字。</li>
        <li>
          价格由站长在各品牌官网或用户后台核对，每篇写明本站与品牌的商业关系；详见
          <Link href="/methodology/" className="ml-1 text-brand-strong underline underline-offset-2">
            测评方法
          </Link>
          与
          <Link href="/disclosure/" className="ml-1 text-brand-strong underline underline-offset-2">
            商业关系披露
          </Link>
          。
        </li>
      </ul>
    </section>
  );
}

/**
 * 栏目列表页。`extras` 是只在第 1 页顶部显示的栏目专属模块，由各自的页面传入
 * （/compare/ 的套餐筛选表由 app/compare/page.tsx 传入，避免其他页面加载它的客户端脚本）。
 */
export function CategoryListing({ category, page, extras }: { category: CategoryMeta; page: number; extras?: ReactNode }) {
  const all = getArticlesByCategory(category.id);
  const { items, totalPages, total } = paginate(all, page, categoryPerPage(category.id));
  const isReviews = category.id === "reviews";
  const reviews = isReviews ? getOrderedReviews() : [];
  const summaries = items.map(toSummary);
  const path = page > 1 ? `${category.path}page/${page}/` : category.path;
  const crumbs = page > 1 ? [{ name: category.label, path: category.path }, { name: `第 ${page} 页`, path }] : [{ name: category.label, path: category.path }];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          itemListJsonLd({
            name: category.id === "recommend" ? "选购方法文章" : `${category.label}文章`,
            path,
            items: (isReviews ? reviews : summaries).map((a) => ({ name: a.title, path: a.path })),
          }),
        ]}
      />
      <PageHeader kicker={category.id} title={page > 1 ? `${category.label}（第 ${page} 页）` : category.label} description={category.intro}>
        <Breadcrumbs items={crumbs} className="mt-6" />
      </PageHeader>
      <div className="container-x py-10 md:py-14">
        {page === 1 && extras}
        {page === 1 && category.id === "recommend" && <NeedsDirectory />}
        {page === 1 && category.id === "speedtest" && <SpeedtestExtras />}
        {page === 1 && category.id === "guides" && <GuidesExtras />}
        {page === 1 && category.id === "reviews" && <ReviewsExtras />}

        <section aria-labelledby="category-articles-title">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 id="category-articles-title" className="section-title">
                {isReviews ? "2026机场测评文章" : category.id === "recommend" ? "选购方法文章" : `${category.label}文章`}
              </h2>
              {isReviews && (
                <p className="mt-2 max-w-3xl text-[0.98rem] leading-relaxed text-ink-soft">
                  汇集主流机场品牌的套餐价格、节点线路、客户端兼容性、AI应用及服务资料，为不同使用需求提供选购参考。
                </p>
              )}
              <p className="mt-1 text-sm text-muted">共 {total} 篇</p>
            </div>
            {category.id === "lingdongyun" && (
              <Link href="/lingdongyun/" className="link-arrow text-sm">
                返回专区
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
          </div>
          {isReviews ? <ReviewsGrid reviews={reviews} filters={REVIEW_FILTERS} /> : <ArticleList articles={summaries} headingLevel="h3" />}
          <Pagination basePath={category.path} page={page} totalPages={totalPages} />
        </section>
      </div>
    </>
  );
}
