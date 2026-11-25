import { CalendarDays, ChevronLeft, ChevronRight, Clock, FileText, FlaskConical, Info, ListTree, RefreshCw, UserRound } from "lucide-react";
import Link from "next/link";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { StatusBadge } from "@/components/ui/Badge";
import { Faq } from "@/components/ui/Faq";
import { brandDisclosureText, getBrand } from "@/lib/brands";
import { formatDate, formatDateTime } from "@/lib/format";
import { getAuthor, getCategory } from "@/lib/site";
import type { Article, ArticleSummary } from "@/lib/types";

import { ArticleBody } from "./ArticleBody";
import { ArticleCard } from "./ArticleCard";
import { BackToTop } from "./BackToTop";
import { InlineBrandRecommendation } from "@/components/brand/InlineBrandRecommendation";
import { ReadingProgress } from "./ReadingProgress";
import { TocList } from "./TocList";

interface ArticleLayoutProps {
  article: Article;
  related: ArticleSummary[];
  prev?: ArticleSummary;
  next?: ArticleSummary;
}

const EVIDENCE_LABEL = {
  "owner-measured": "站长实测",
  "owner-screenshot": "站长提供截图",
  "text-record": "文字记录（无截图）",
} as const;

function InfoPanel({ article }: { article: Article }) {
  const fm = article.frontmatter;
  const brand = fm.brand ? getBrand(fm.brand) : undefined;
  const disclosure = fm.disclosure ?? (brand ? brandDisclosureText(brand) : undefined);
  const hasAny = fm.sources?.length || fm.methodology || disclosure || fm.plansVerifiedAt || fm.test || fm.changes?.length;
  if (!hasAny) return null;
  return (
    <aside className="mt-8 rounded-2xl border border-line bg-white p-5 text-sm" aria-label="信息来源与说明">
      <dl className="space-y-4">
        {fm.test && (
          <div>
            <dt className="flex items-center gap-1.5 font-semibold text-ink">
              <FlaskConical size={15} aria-hidden="true" />
              测试信息
            </dt>
            <dd className="mt-1 text-ink-soft">
              <ul className="space-y-0.5">
                <li>测试时间：{formatDateTime(fm.test.testedAt)}（北京时间）</li>
                <li>网络环境：{fm.test.network}</li>
                <li>工具：{fm.test.tool}</li>
                <li>方法：{fm.test.method}</li>
                <li>证据类型：{EVIDENCE_LABEL[fm.test.evidence]}</li>
              </ul>
              {fm.test.limitations?.length ? (
                <ul className="mt-2 list-disc pl-5 text-muted">
                  {fm.test.limitations.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              ) : null}
            </dd>
          </div>
        )}
        {fm.sources?.length ? (
          <div>
            <dt className="flex items-center gap-1.5 font-semibold text-ink">
              <FileText size={15} aria-hidden="true" />
              信息来源
            </dt>
            <dd className="mt-1">
              <ul className="space-y-0.5 text-ink-soft">
                {fm.sources.map((s) => (
                  <li key={s.label}>
                    {s.url && /^https?:\/\//i.test(s.url) ? (
                      <a href={s.url} target="_blank" rel="nofollow noopener noreferrer" className="text-brand-strong underline underline-offset-2">
                        {s.label}
                      </a>
                    ) : s.url ? (
                      <Link href={s.url} className="text-brand-strong underline underline-offset-2">
                        {s.label}
                      </Link>
                    ) : (
                      s.label
                    )}
                    {s.date ? `（${s.date}）` : ""}
                    {s.note ? ` · ${s.note}` : ""}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}
        {fm.methodology && (
          <div>
            <dt className="flex items-center gap-1.5 font-semibold text-ink">
              <Info size={15} aria-hidden="true" />
              测评方法
            </dt>
            <dd className="mt-1 text-ink-soft">
              {fm.methodology}{" "}
              <Link href="/methodology/" className="text-brand-strong underline underline-offset-2">
                测评方法
              </Link>
            </dd>
          </div>
        )}
        {fm.plansVerifiedAt && (
          <div>
            <dt className="flex items-center gap-1.5 font-semibold text-ink">
              <RefreshCw size={15} aria-hidden="true" />
              套餐核实日期
            </dt>
            <dd className="mt-1 text-ink-soft">{formatDate(fm.plansVerifiedAt)}，价格与优惠以官网结算页为准。</dd>
          </div>
        )}
        {disclosure && (
          <div>
            <dt className="flex items-center gap-1.5 font-semibold text-ink">
              <Info size={15} aria-hidden="true" />
              推广披露
            </dt>
            <dd className="mt-1 text-ink-soft">
              {disclosure}{" "}
              <Link href="/disclosure/" className="text-brand-strong underline underline-offset-2">
                商业关系披露
              </Link>
            </dd>
          </div>
        )}
        {fm.changes?.length ? (
          <div>
            <dt className="flex items-center gap-1.5 font-semibold text-ink">
              <RefreshCw size={15} aria-hidden="true" />
              修改记录
            </dt>
            <dd className="mt-1">
              <ul className="space-y-0.5 text-ink-soft">
                {[...fm.changes]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((c) => (
                    <li key={c.date + c.note}>
                      <time dateTime={c.date}>{formatDate(c.date)}</time>：{c.note}
                    </li>
                  ))}
              </ul>
            </dd>
          </div>
        ) : null}
      </dl>
    </aside>
  );
}

export function ArticleLayout({ article, related, prev, next }: ArticleLayoutProps) {
  const fm = article.frontmatter;
  const category = getCategory(fm.category);
  const author = getAuthor(fm.author);
  const updated = fm.updatedAt !== fm.publishedAt;

  return (
    <>
      <ReadingProgress />
      <article className="animate-fade-in">
        <header className="surface-gradient border-b border-line-soft">
          <div className="container-x py-8 md:py-12">
            <Breadcrumbs
              items={[
                { name: category?.label ?? fm.category, path: category?.path ?? `/${fm.category}/` },
                { name: fm.title, path: article.path },
              ]}
            />
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Link href={category?.path ?? "/"} className="chip">
                {category?.label}
              </Link>
              {fm.draft && <StatusBadge kind="draft" label="草稿 · 待核实，仅开发环境可见" />}
              {fm.test && <StatusBadge kind={fm.test.evidence === "text-record" ? "text-record" : "measured"} label={EVIDENCE_LABEL[fm.test.evidence]} />}
            </div>
            <h1 className="mt-4 max-w-[760px] text-3xl font-bold leading-tight tracking-tight text-ink md:text-4xl">{fm.title}</h1>
            <p className="mt-4 max-w-[760px] text-base leading-relaxed text-ink-soft md:text-lg">{fm.description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <UserRound size={15} aria-hidden="true" />
                <Link href={author.url} rel="author" className="font-medium text-ink-soft hover:text-brand-strong">
                  {author.name}
                </Link>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={15} aria-hidden="true" />
                发布于 <time dateTime={fm.publishedAt}>{formatDate(fm.publishedAt)}</time>
              </span>
              {updated && (
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCw size={15} aria-hidden="true" />
                  更新于 <time dateTime={fm.updatedAt}>{formatDate(fm.updatedAt)}</time>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock size={15} aria-hidden="true" />
                约 {article.readingMinutes} 分钟 · {article.charCount} 字
              </span>
            </div>
          </div>
        </header>

        <div className="container-x">
          <div className="grid gap-12 py-10 lg:grid-cols-[minmax(0,760px)_280px] lg:justify-center">
            <div className="min-w-0">
              <figure className="zoom-on-hover overflow-hidden rounded-2xl border border-line bg-sky-soft">
                <img
                  src={fm.cover}
                  alt={fm.coverAlt ?? `${fm.title} 封面图`}
                  width={1200}
                  height={630}
                  loading="eager"
                  fetchPriority="high"
                  className="block h-auto w-full transition-transform duration-500"
                />
              </figure>

              <section className="mt-8 rounded-2xl border border-brand/20 bg-sky-soft/70 p-5" aria-labelledby="summary-title">
                <h2 id="summary-title" className="text-sm font-bold uppercase tracking-wider text-brand">
                  核心摘要
                </h2>
                {fm.summaryPoints?.length ? (
                  <ul className="mt-3 space-y-1.5 text-[0.95rem] text-ink">
                    {fm.summaryPoints.map((p) => (
                      <li key={p} className="flex gap-2">
                        <span aria-hidden="true" className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[0.95rem] text-ink">{fm.description}</p>
                )}
              </section>

              <InfoPanel article={article} />

              {article.toc.length > 0 && (
                <details className="group mt-8 rounded-2xl border border-line bg-white lg:hidden">
                  <summary className="flex items-center justify-between gap-2 px-5 py-4 font-semibold text-ink">
                    <span className="inline-flex items-center gap-2">
                      <ListTree size={16} aria-hidden="true" />
                      目录
                    </span>
                    <ChevronRight size={16} aria-hidden="true" className="transition-transform duration-200 group-open:rotate-90" />
                  </summary>
                  <div className="border-t border-line-soft px-5 py-3">
                    <TocList items={article.toc} />
                  </div>
                </details>
              )}

              <div className="mt-8">
                <ArticleBody source={article.body} />
              </div>

              {/* 测评文章在正文里有“常见问题FAQ”小节（与 frontmatter faq 逐字一致），这里不再重复渲染 */}
              {fm.faq?.length && !/^## 常见问题FAQ\s*$/m.test(article.body) ? (
                <section className="mt-12" aria-labelledby="article-faq-title">
                  <h2 id="article-faq-title" className="mb-5 text-2xl font-bold text-ink">
                    常见问题
                  </h2>
                  <Faq items={fm.faq} />
                </section>
              ) : null}

              {fm.brand && !article.body.includes("<InlineBrandRecommendation") && <InlineBrandRecommendation brand={fm.brand} />}

              <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-line-soft pt-6">
                <span className="text-sm text-muted">标签：</span>
                {fm.tags.map((t) => (
                  <Link key={t} href={`/tags/${encodeURIComponent(t)}/`} className="chip chip-outline hover:border-brand hover:text-brand-strong">
                    #{t}
                  </Link>
                ))}
              </div>

              {(prev || next) && (
                <nav aria-label="上一篇 / 下一篇" className="mt-8 grid gap-4 sm:grid-cols-2">
                  {prev ? (
                    <Link href={prev.path} rel="prev" className="card card-hover flex items-start gap-3 p-4">
                      <ChevronLeft size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-brand" />
                      <span>
                        <span className="field-label">上一篇</span>
                        <span className="mt-0.5 line-clamp-2 block font-semibold text-ink">{prev.title}</span>
                      </span>
                    </Link>
                  ) : (
                    <span />
                  )}
                  {next && (
                    <Link href={next.path} rel="next" className="card card-hover flex items-start justify-end gap-3 p-4 text-right">
                      <span>
                        <span className="field-label">下一篇</span>
                        <span className="mt-0.5 line-clamp-2 block font-semibold text-ink">{next.title}</span>
                      </span>
                      <ChevronRight size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-brand" />
                    </Link>
                  )}
                </nav>
              )}
            </div>

            <aside className="hidden lg:block" aria-label="文章目录">
              <div className="sticky top-24 space-y-6">
                {article.toc.length > 0 && (
                  <nav className="rounded-2xl border border-line bg-white p-5" aria-labelledby="toc-title">
                    <p id="toc-title" className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                      <ListTree size={16} aria-hidden="true" />
                      目录
                    </p>
                    <TocList items={article.toc} />
                  </nav>
                )}
                <div className="rounded-2xl border border-line bg-white p-5 text-sm">
                  <Link href={author.url} rel="author" className="font-bold text-ink hover:text-brand-strong">
                    {author.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted">{author.role}</p>
                  <Link href="/methodology/" className="mt-3 inline-block text-brand-strong underline underline-offset-2">
                    我们怎么核实资料与测速
                  </Link>
                </div>
              </div>
            </aside>
          </div>

          {related.length > 0 && (
            <section className="border-t border-line-soft py-12" aria-labelledby="related-title">
              <h2 id="related-title" className="section-title mb-6">
                相关阅读
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {related.map((a) => (
                  <ArticleCard key={a.slug} article={a} />
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
      <BackToTop />
    </>
  );
}
