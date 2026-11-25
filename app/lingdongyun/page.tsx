import type { Metadata } from "next";
import { ArrowRight, BookOpen, CalendarDays, Globe, HelpCircle, LifeBuoy, Package, RefreshCw, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";

import { ArticleBody } from "@/components/article/ArticleBody";
import { ArticleCard } from "@/components/article/ArticleCard";
import { BrandCTA } from "@/components/brand/BrandCTA";
import { BrandProfile } from "@/components/brand/BrandProfile";
import { BrandSources } from "@/components/brand/BrandSources";
import { PlanTable } from "@/components/brand/PlanTable";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { Faq } from "@/components/ui/Faq";
import { brandPageDates, getBrandEditorial } from "@/lib/brand-editorials";
import { LINGDONGYUN, brandDisclosureText } from "@/lib/brands";
import { getArticlesByCategory, getSpeedtestReportsByRegion, toSummary } from "@/lib/content";
import { LINGDONGYUN_FAQ } from "@/lib/faq";
import { formatDate } from "@/lib/format";
import { brandPageJsonLd, breadcrumbJsonLd, buildMetadata, faqJsonLd } from "@/lib/seo";
import { getAuthor, getCategory } from "@/lib/site";

const meta = getCategory("lingdongyun")!;
/** 专区的标题、描述、要点、正文与常见问题来自 content/brands/lingdongyun.mdx */
const editorial = getBrandEditorial("lingdongyun");
const dates = brandPageDates(LINGDONGYUN);
const H1 = editorial?.frontmatter.h1 ?? "灵动云机场怎么样？2026 套餐价格与使用指南";
const DESCRIPTION = editorial?.frontmatter.description ?? meta.seoDescription;
const FAQ_ITEMS = editorial?.frontmatter.faq ?? LINGDONGYUN_FAQ;

export const metadata: Metadata = buildMetadata({
  title: editorial?.frontmatter.seoTitle ?? meta.seoTitle,
  description: DESCRIPTION,
  path: "/lingdongyun/",
  type: "article",
  publishedTime: dates.publishedAt,
  modifiedTime: dates.updatedAt,
  image: "/images/og/lingdongyun.png",
});

const SECTIONS = [
  ...(editorial?.toc.filter((t) => t.depth === 2).map((t) => ({ id: t.id, label: t.text })) ?? []),
  { id: "features", label: "服务特点" },
  { id: "plans", label: "套餐信息" },
  { id: "client", label: "客户端教程" },
  { id: "nodes", label: "节点与测试记录" },
  { id: "troubleshooting", label: "连接问题" },
  { id: "faq", label: "常见问题" },
  { id: "buy", label: "官网入口" },
  { id: "sources", label: "来源与更新" },
];

const FEATURES = [
  { title: "IEPL / IPLC 优化线路", text: "资料显示主打专线优化，覆盖香港、台湾、日本、新加坡、美国五个地区；穿云套餐为 IPLC 专线，全节点统一 1x 倍率。" },
  { title: "官方客户端，登录即连", text: "以官方客户端为主要入口，账号登录即可连接，不需要先学会导入订阅、写规则；适合第一次使用机场的人。" },
  { title: "套餐从月付 ¥20 起", text: "周期套餐四档（100 GB 到 1500 GB / 月），另有 ¥99 / 年的穿云小包、三档不限时流量包和独享定制线路。" },
  { title: "进阶用户可申请订阅", text: "资料写明：符合条件的高流量套餐用户可以联系客服申请订阅链接，用于兼容的第三方客户端；具体以客服答复为准。" },
  { title: "不限同时在线设备", text: "资料显示不限同时在线设备数；支持的具体系统资料未逐一列出，站长实测报告显示使用客户端 V3.0.0。" },
  { title: "客服与使用指导", text: "Crisp 在线客服、工单（24 小时内回复）与 Telegram 公告频道；客服可协助安装、节点切换、DNS、TUN 与 iOS 客户端问题。" },
];

const TROUBLESHOOTING = [
  {
    q: "客户端已登录但网页打不开",
    a: "先切换一个节点确认不是单个节点故障；再检查系统代理或 TUN 模式是否开启；仍不行时按排查教程逐步处理。",
    href: "/guides/dns-and-connection-troubleshooting/",
    label: "DNS 与连接故障排查",
  },
  {
    q: "想用 Clash / Mihomo 等第三方客户端",
    a: "资料显示订阅链接需向客服询问，符合条件的套餐可申请。不要使用网上出售的“订阅链接”。",
    href: "/guides/clash-verge-rev-guide/",
    label: "Clash Verge Rev 使用教程",
  },
  { q: "iOS 上怎么用", a: "资料提到客服可协助 iOS 客户端相关问题；通用的 iOS 客户端思路见教程。", href: "/guides/ios-client-setup/", label: "iOS 客户端教程" },
  {
    q: "速度不稳定、晚高峰变慢",
    a: "先在客户端里测延迟，换同地区的其他节点对比；本站的记录显示不同时段、不同节点差别很大，自测时要固定节点和时段。",
    href: "/speedtest/peak-hour-stability-guide/",
    label: "晚高峰变慢怎么办",
  },
];

export default function LingdongyunPage() {
  const brand = LINGDONGYUN;
  const fm = editorial?.frontmatter;
  const author = getAuthor(fm?.author ?? "editorial");
  const articles = getArticlesByCategory("lingdongyun").map(toSummary);
  const reportsByRegion = getSpeedtestReportsByRegion();
  const reports = [...new Map([...reportsByRegion.values()].flat().map((a) => [a.path, a])).values()]
    .filter((a) => a.frontmatter.brand === "lingdongyun")
    .sort((a, b) => b.frontmatter.test!.testedAt.localeCompare(a.frontmatter.test!.testedAt));
  const crumbs = [{ name: meta.label, path: "/lingdongyun/" }];

  return (
    <>
      <JsonLd
        data={[
          brandPageJsonLd({
            path: "/lingdongyun/",
            headline: H1,
            description: DESCRIPTION,
            datePublished: dates.publishedAt,
            dateModified: dates.updatedAt,
            author: fm?.author ?? "editorial",
            brandId: brand.id,
            image: "/images/og/lingdongyun.png",
          }),
          breadcrumbJsonLd(crumbs),
          faqJsonLd(FAQ_ITEMS),
        ]}
      />

      <header className="brand-gradient relative overflow-hidden text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30">
          <svg className="absolute -right-20 -top-24 h-[420px] w-[620px]" viewBox="0 0 620 420" fill="none">
            <circle cx="420" cy="200" r="180" stroke="#fff" strokeOpacity="0.35" />
            <circle cx="420" cy="200" r="120" stroke="#fff" strokeOpacity="0.3" />
            <path d="M0 360C140 260 260 380 420 270S560 150 640 190" stroke="#fff" strokeOpacity="0.4" strokeWidth="2" />
          </svg>
        </div>
        <div className="container-x relative py-12 md:py-16">
          <Breadcrumbs items={crumbs} className="[&_a]:text-white/80 [&_a:hover]:text-white [&_span]:text-white [&_svg]:text-white/50" />
          <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide">
            <Sparkles size={14} aria-hidden="true" />
            {meta.label} · 首页推荐榜第 1 名（编辑推荐，含推广合作因素）
          </span>
          <h1 className="mt-4 max-w-4xl text-3xl font-bold leading-tight tracking-tight md:text-5xl">{H1}</h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-sky">
            {brand.name} {brand.nameEn}
          </p>
          <p className="mt-4 max-w-2xl text-lg text-white/90">{DESCRIPTION}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
            <span className="inline-flex items-center gap-1.5">
              <UserRound size={15} aria-hidden="true" />
              <Link href={author.url} rel="author" className="font-medium text-white hover:underline">
                {author.name}
              </Link>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={15} aria-hidden="true" />
              发布于 <time dateTime={dates.publishedAt}>{formatDate(dates.publishedAt)}</time>
            </span>
            {dates.updatedAt !== dates.publishedAt && (
              <span className="inline-flex items-center gap-1.5">
                <RefreshCw size={15} aria-hidden="true" />
                更新于 <time dateTime={dates.updatedAt}>{formatDate(dates.updatedAt)}</time>
              </span>
            )}
          </div>
          {fm?.summaryPoints?.length ? (
            <ul className="mt-6 max-w-3xl space-y-1.5 rounded-2xl bg-white/10 p-5 text-[0.95rem] text-white">
              {fm.summaryPoints.map((p) => (
                <li key={p} className="flex gap-2">
                  <span aria-hidden="true" className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#plans" className="btn bg-white text-brand-deep hover:bg-sky">
              灵动云套餐与优惠码
              <ArrowRight size={16} aria-hidden="true" className="btn-arrow" />
            </a>
            <BrandCTA brand={brand} label="前往灵动云官网注册" variant="light" className="border border-white/40 !bg-transparent !text-white hover:!bg-white/10" />
          </div>
          <p className="mt-6 max-w-2xl text-xs leading-relaxed text-white/80">
            {brandDisclosureText(brand)}{" "}
            <Link href="/disclosure/" className="font-semibold underline underline-offset-2">
              商业关系披露
            </Link>
          </p>
        </div>
        <nav aria-label="专题目录" className="relative border-t border-white/15 bg-black/10">
          <ul className="container-x flex gap-1 overflow-x-auto py-2 text-sm">
            {SECTIONS.map((s) => (
              <li key={s.id} className="shrink-0">
                <a href={`#${s.id}`} className="inline-flex min-h-9 items-center rounded-full px-3 font-medium text-white/85 hover:bg-white/10 hover:text-white">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div className="container-x space-y-16 py-12 md:py-16">
        {editorial ? (
          <article className="mx-auto max-w-[760px]" aria-label="灵动云编辑正文">
            <ArticleBody source={editorial.body} />
          </article>
        ) : (
          <section id="intro" className="scroll-mt-24" aria-labelledby="intro-title">
            <span className="section-kicker">Introduction</span>
            <h2 id="intro-title" className="section-title">
              灵动云品牌介绍
            </h2>
            <p className="mt-4 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft">{brand.summary}</p>
          </section>
        )}

        <section id="features" className="scroll-mt-24" aria-labelledby="features-title">
          <span className="section-kicker">Features</span>
          <h2 id="features-title" className="section-title">
            灵动云服务特点（资料整理）
          </h2>
          <p className="section-desc">以下整理自站长提供的品牌资料（资料于 {formatDate("2026-11-09")} 与原文逐项核对；价格核对日期 {brand.verifiedAt ? formatDate(brand.verifiedAt) : "待核实"}，由站长在官网或用户后台核对），资料注明速度、稳定性及流媒体、AI 工具的可用性不作持续保证，以实测为准。</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-5">
                <h3 className="text-base font-bold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="plans" className="scroll-mt-24" aria-labelledby="plans-title">
          <span className="section-kicker">Plans</span>
          <h2 id="plans-title" className="section-title inline-flex items-center gap-2">
            <Package size={24} aria-hidden="true" className="text-brand" />
            灵动云套餐信息与优惠码
          </h2>
          <p className="section-desc">
            优惠码 <code className="rounded bg-sky-soft px-1.5 py-0.5 font-mono font-bold text-brand-deep">{brand.coupon?.code}</code>（{brand.coupon?.discount}）适用于{" "}
            {brand.coupon?.appliesTo.join("、")}；不适用于 {brand.coupon?.excludes.join("、")}。{brand.coupon?.usage}。
          </p>
          <PlanTable brand="lingdongyun" />
          <div className="flex flex-wrap gap-3">
            <Link href="/compare/lingdongyun-plans-compared/" className="btn btn-secondary">
              哪一档适合你：套餐横向比较
              <ArrowRight size={16} aria-hidden="true" className="btn-arrow" />
            </Link>
            <Link href="/lingdongyun/lingdongyun-plans-and-policies/" className="btn btn-secondary">
              流量规则、退款与支持政策
            </Link>
          </div>
        </section>

        <section id="client" className="scroll-mt-24" aria-labelledby="client-title">
          <span className="section-kicker">Client</span>
          <h2 id="client-title" className="section-title inline-flex items-center gap-2">
            <BookOpen size={24} aria-hidden="true" className="text-brand" />
            客户端教程
          </h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="card p-6">
              <h3 className="text-base font-bold text-ink">五步开始使用（资料中的购买流程整理）</h3>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink-soft">
                <li>进入灵动云官网注册账号（可通过本站推广链接进入）。</li>
                <li>首次购买先选月付或最小的套餐试用。</li>
                <li>在结算页填写优惠码 {brand.coupon?.code}，确认折扣生效后付款。</li>
                <li>从官网下载官方客户端，用账号登录。</li>
                <li>选择节点连接；建议在晚高峰（20:00–23:00）多用几天，确认满意再考虑长周期。</li>
              </ol>
              <Link href="/lingdongyun/lingdongyun-client-guide/" className="link-arrow mt-4 text-sm">
                完整客户端教程：登录、切换节点、订阅申请、TUN 与 DNS
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-3">
              {[
                { label: "Windows 客户端教程", href: "/guides/windows-client-setup/" },
                { label: "Android 客户端教程", href: "/guides/android-client-setup/" },
                { label: "iOS 客户端教程", href: "/guides/ios-client-setup/" },
                { label: "Clash Verge Rev 使用教程（申请订阅后使用）", href: "/guides/clash-verge-rev-guide/" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="card card-hover flex items-center justify-between gap-3 p-4 text-sm font-semibold text-ink">
                  {l.label}
                  <ArrowRight size={16} aria-hidden="true" className="shrink-0 text-brand" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="nodes" className="scroll-mt-24" aria-labelledby="nodes-title">
          <span className="section-kicker">Nodes</span>
          <h2 id="nodes-title" className="section-title inline-flex items-center gap-2">
            <Globe size={24} aria-hidden="true" className="text-brand" />
            节点线路知识
          </h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="card p-6">
              <h3 className="text-base font-bold text-ink">资料中的节点分布</h3>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                {Object.entries(brand.nodeCountByRegion ?? {}).map(([region, count]) => (
                  <li key={region} className="rounded-xl border border-line-soft bg-bg px-3 py-2">
                    <span className="block text-xs text-muted">{region}</span>
                    <span className="text-lg font-bold text-ink">{count}</span>
                    <span className="ml-1 text-xs text-muted">个节点</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-ink-soft">线路：{brand.lineTypes.join("；")}。{brand.ratio}。</p>
              <Link href="/speedtest/node-regions-explained/" className="link-arrow mt-4 text-sm">
                各地区节点分别适合做什么
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="card p-6">
              <h3 className="text-base font-bold text-ink">本站的灵动云测试记录</h3>
              {reports.length ? (
                <ul className="mt-3 space-y-3">
                  {reports.map((r) => (
                    <li key={r.path} className="border-b border-line-soft pb-3 last:border-0 last:pb-0">
                      <Link href={r.path} className="font-semibold text-ink hover:text-brand-strong">
                        {r.frontmatter.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatDate(r.frontmatter.test!.testedAt.slice(0, 10))} · {r.frontmatter.test!.network} · {r.frontmatter.test!.tool}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">暂无测试记录。</p>
              )}
              <p className="mt-3 text-xs text-muted">每份记录都注明日期与出口节点，网络环境和工具写到资料能提供的程度，缺的项标“未注明”，并说明局限；不同时段、不同网络的结果不能直接比较。</p>
            </div>
          </div>
        </section>

        <section id="troubleshooting" className="scroll-mt-24" aria-labelledby="troubleshooting-title">
          <span className="section-kicker">Troubleshooting</span>
          <h2 id="troubleshooting-title" className="section-title inline-flex items-center gap-2">
            <LifeBuoy size={24} aria-hidden="true" className="text-brand" />
            常见连接问题
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {TROUBLESHOOTING.map((t) => (
              <div key={t.q} className="card p-5">
                <h3 className="text-base font-bold text-ink">{t.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t.a}</p>
                <Link href={t.href} className="link-arrow mt-3 text-sm">
                  {t.label}
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="scroll-mt-24" aria-labelledby="ldy-faq-title">
          <span className="section-kicker">FAQ</span>
          <h2 id="ldy-faq-title" className="section-title inline-flex items-center gap-2">
            <HelpCircle size={24} aria-hidden="true" className="text-brand" />
            灵动云常见问题
          </h2>
          <div className="mt-6">
            <Faq items={FAQ_ITEMS} />
          </div>
        </section>

        <section id="buy" className="scroll-mt-24" aria-labelledby="buy-title">
          <div className="brand-gradient rounded-2xl p-6 text-white md:p-10">
            <span className="section-kicker !text-sky">Official</span>
            <h2 id="buy-title" className="text-2xl font-bold md:text-3xl">
              官网与购买入口
            </h2>
            <p className="mt-3 max-w-2xl text-white/90">
              只通过官网注册购买，价格与优惠以结算页为准；网上出售的订阅链接、网盘分发的客户端均非官方渠道。第一次购买建议先选月付或最小套餐。
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <BrandCTA brand={brand} label="前往灵动云官网注册" variant="light" />
              {brand.coupon && (
                <span className="text-sm text-white/90">
                  结算时填写优惠码 <code className="rounded bg-white/20 px-1.5 py-0.5 font-mono text-base font-bold">{brand.coupon.code}</code>
                </span>
              )}
            </div>
            <p className="mt-6 text-xs leading-relaxed text-white/80">
              {brandDisclosureText(brand)}{" "}
              <Link href="/disclosure/" className="font-semibold underline underline-offset-2">
                商业关系披露全文
              </Link>
            </p>
          </div>
        </section>

        <section id="brand-data" className="scroll-mt-24" aria-labelledby="brand-data-title">
          <span className="section-kicker">Data</span>
          <h2 id="brand-data-title" className="section-title mb-6">
            灵动云资料档案与核实记录
          </h2>
          <BrandProfile brand={brand} showCta={false} showIntro={!editorial} showSources={false} />
        </section>

        <BrandSources brand={brand} publishedAt={dates.publishedAt} updatedAt={dates.updatedAt} changes={fm?.changes} />

        {articles.length > 0 && (
          <section aria-labelledby="ldy-articles-title">
            <h2 id="ldy-articles-title" className="section-title mb-6">
              灵动云专区文章
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
