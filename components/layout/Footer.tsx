import { Rss } from "lucide-react";
import Link from "next/link";

import { CATEGORIES, SITE } from "@/lib/site";
import { formatDate } from "@/lib/format";

import { LogoMark } from "./Logo";

interface FooterProps {
  lastUpdated: string;
  latest: { title: string; href: string }[];
}

const ABOUT_LINKS = [
  { label: "关于我们", href: "/about/" },
  { label: "测评方法与排序原则", href: "/methodology/" },
  { label: "商业关系披露", href: "/disclosure/" },
  { label: "更新记录", href: "/updates/" },
  { label: "联系与纠错", href: "/contact/" },
  { label: "隐私说明", href: "/privacy/" },
];

export function Footer({ lastUpdated, latest }: FooterProps) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="container-x py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark size={28} />
              <span className="text-lg font-bold text-ink">{SITE.name}</span>
            </div>
            <p className="mt-3 text-sm text-ink-soft">{SITE.tagline}</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
              机场推荐、套餐比较、节点测试记录与客户端教程。价格注明核对日期，测试注明日期、出口节点与方法，不编造评分与用户好评。
            </p>
            <p className="mt-4 rounded-xl border border-line bg-sky-soft/60 p-3 text-xs leading-relaxed text-ink-soft">
              <strong className="font-semibold">商业关系披露：</strong>首页推荐榜与品牌资料库中的品牌均与本站存在推广合作，推荐顺序包含推广合作因素。通过本站链接注册或购买，本站可能获得佣金，你支付的价格不变。
              <Link href="/disclosure/" className="ml-1 font-semibold text-brand-strong underline underline-offset-2">
                商业关系披露全文
              </Link>
            </p>
          </div>

          <nav aria-label="关于本站">
            <p className="text-sm font-bold uppercase tracking-wider text-ink">关于本站</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {ABOUT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-ink-soft transition-colors hover:text-brand-strong">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="内容分类">
            <p className="text-sm font-bold uppercase tracking-wider text-ink">内容分类</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <Link href={c.path} className="text-ink-soft transition-colors hover:text-brand-strong">
                    {c.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/brands/" className="text-ink-soft transition-colors hover:text-brand-strong">
                  品牌资料库
                </Link>
              </li>
              <li>
                <Link href="/articles/" className="text-ink-soft transition-colors hover:text-brand-strong">
                  全部文章
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="最近更新">
            <p className="text-sm font-bold uppercase tracking-wider text-ink">最近更新</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {latest.map((a) => (
                <li key={a.href}>
                  <Link href={a.href} className="line-clamp-2 text-ink-soft transition-colors hover:text-brand-strong">
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href="/rss.xml"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-strong hover:underline"
            >
              <Rss size={16} aria-hidden="true" />
              RSS 订阅
            </a>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line-soft pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE.name} {SITE.nameEn} · {SITE.domain} · 全站内容最近更新：
            <time dateTime={lastUpdated}>{formatDate(lastUpdated)}</time>
            {SITE.contactEmail && (
              <>
                {" "}
                · 纠错邮箱：
                <a href={`mailto:${SITE.contactEmail}`} className="text-brand-strong hover:underline">
                  {SITE.contactEmail}
                </a>
              </>
            )}
          </p>
          <p>本站内容仅供参考，不构成任何服务承诺；各品牌价格与政策以其官网结算页为准。</p>
        </div>
      </div>
    </footer>
  );
}
