import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { NEED_GROUPS, NODE_KNOWLEDGE_LINKS } from "@/lib/home-content";

/** 首页 H2「不同网络使用需求如何选择机场」：每组两三句建议 + 对应文章；完整的品牌对照在 /recommend/ */
export function HomeNeeds() {
  return (
    <section id="needs" className="container-x scroll-mt-24 py-12 md:py-16" aria-labelledby="needs-title">
      <span className="section-kicker">Needs</span>
      <h2 id="needs-title" className="section-title">
        不同网络使用需求如何选择机场
      </h2>
      <p className="section-desc">
        先想清楚主要用途，再看对应的条件：AI 工具看出口地区，流媒体看流量和片库地区，全家共用看设备与流量是否共享，想自定义规则就要看能不能用第三方客户端。每组都依据品牌资料写成，品牌说法未经本站测试。
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {NEED_GROUPS.map((n) => (
          <div key={n.id} className="card flex flex-col p-5">
            <h3 className="text-base font-bold text-ink">{n.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{n.summary}</p>
            <ul className="mt-auto space-y-1 pt-4 text-sm">
              {n.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="link-arrow">
                    {l.label}
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-line-soft bg-white p-4 text-sm md:flex-row md:items-center md:justify-between">
        <p className="text-ink-soft">
          节点与线路知识：
          {NODE_KNOWLEDGE_LINKS.map((l, i) => (
            <span key={l.href}>
              <Link href={l.href} className="font-medium text-brand-strong hover:underline">
                {l.label}
              </Link>
              {i < NODE_KNOWLEDGE_LINKS.length - 1 ? "、" : ""}
            </span>
          ))}
        </p>
        <Link href="/recommend/" className="link-arrow shrink-0">
          按需选机场：每组的品牌资料对照
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
