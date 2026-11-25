import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";

import { SectionHeading } from "@/components/layout/SectionHeading";
import { REGIONS } from "@/lib/regions";
import { formatDate } from "@/lib/format";

export interface RegionReportLink {
  title: string;
  path: string;
  testedAt: string;
  brand?: string;
}

export function RegionGrid({ reports, compact = false }: { reports: Record<string, RegionReportLink[]>; compact?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {REGIONS.map((r) => {
        const list = reports[r.name] ?? [];
        return (
          <article key={r.id} id={`region-${r.id}`} className="card flex h-full flex-col p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-soft text-brand">
                <MapPin size={18} aria-hidden="true" />
              </span>
              <h3 className="text-lg font-bold text-ink">
                {r.name}
                <span className="ml-2 text-xs font-medium uppercase tracking-wider text-muted">{r.nameEn}</span>
              </h3>
            </div>
            <p className={`mt-3 text-sm text-ink-soft ${compact ? "line-clamp-3" : ""}`}>{r.summary}</p>
            {!compact && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {r.uses.map((u) => (
                  <li key={u} className="chip chip-outline">
                    {u}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 border-t border-line-soft pt-3 text-sm">
              <p className="field-label">本站测试记录</p>
              {list.length ? (
                <ul className="mt-1.5 space-y-1.5">
                  {list.map((x) => (
                    <li key={x.path}>
                      <Link href={x.path} className="link-arrow text-[0.85rem]">
                        <span className="line-clamp-2">{x.title}</span>
                        <ArrowRight size={14} aria-hidden="true" className="shrink-0" />
                      </Link>
                      <span className="block text-xs text-muted">
                        测试日期 <time dateTime={x.testedAt}>{formatDate(x.testedAt)}</time>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1.5 text-[0.85rem] text-muted">暂无本站实测记录，不显示估算数据。</p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function RegionsSection({ reports }: { reports: Record<string, RegionReportLink[]> }) {
  return (
    <section className="border-y border-line-soft bg-white py-14 md:py-20" aria-labelledby="regions-title">
      <div className="container-x">
        <SectionHeading
          id="regions-title"
          kicker="Regions"
          title="节点知识与测速"
          description="七个常见地区的用途与注意点。只有标注了日期、出口节点和方法的测试才会出现在这里。"
          link={{ label: "进入节点实测", href: "/speedtest/" }}
        />
        <RegionGrid reports={reports} compact />
      </div>
    </section>
  );
}
