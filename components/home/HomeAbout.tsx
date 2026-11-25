import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { CHANGELOG } from "@/lib/changelog";
import { formatDate } from "@/lib/format";

/** 首页 H2「关于机场优选及内容更新说明」 */
export function HomeAbout() {
  const recent = CHANGELOG.slice(0, 3);
  return (
    <section id="about-site" className="scroll-mt-24 border-t border-line-soft bg-white py-12 md:py-16" aria-labelledby="about-site-title">
      <div className="container-x grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <span className="section-kicker">About</span>
          <h2 id="about-site-title" className="section-title">
            关于机场优选及内容更新说明
          </h2>
          <div className="mt-5 space-y-4 text-[0.98rem] leading-relaxed text-ink-soft">
            <p>
              机场优选（JichangXuan）是简体中文的机场推荐与教程博客，由站长运营，编辑部负责整理资料和写作。我们想做的事很简单：把挑选机场需要看的信息放在一处，并且把每条信息的来源和日期写清楚。
            </p>
            <p>
              价格由站长在各品牌官网或用户后台逐项核对，标“已核对”和核对日期（目前收录的 20 个品牌均为 2026 年 11 月 25 日）；价格可能变动，购买前以官网结算页为准。节点、线路、客户端与售后等其他内容来自品牌资料，资料没写或说法有冲突的标“待核实”。测试只写本站真正做过的，每份记录注明日期、出口节点和资料能提供的网络环境与工具，缺的项标“未注明”；品牌资料附带的文字记录会单独标注，不算作本站测试。没有测试的品牌，页面不写任何估算的速度或稳定性。
            </p>
            <p>
              首页推荐榜是编辑推荐顺序，包含推广合作因素，不是测速或评分排名。上榜 12 家与本站存在推广合作，通过本站链接购买，本站可能获得佣金，你支付的价格不变。价格、节点或客户端政策有变化时，我们会更新对应页面，并在更新记录里写明改了什么；纠错方式见联系与纠错页。
            </p>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {[
              { label: "关于我们与作者", href: "/about/" },
              { label: "测评方法与推荐榜排序原则", href: "/methodology/" },
              { label: "商业关系披露", href: "/disclosure/" },
              { label: "联系与纠错", href: "/contact/" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="link-arrow">
                  {l.label}
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-line-soft bg-bg p-5">
          <h3 className="text-base font-bold text-ink">最近更新</h3>
          <ol className="mt-3 space-y-4">
            {recent.map((c) => (
              <li key={c.date + c.title}>
                <p className="text-xs font-semibold text-muted">
                  <time dateTime={c.date}>{formatDate(c.date)}</time>
                </p>
                <p className="mt-0.5 font-semibold text-ink">{c.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{c.items[0]}</p>
              </li>
            ))}
          </ol>
          <Link href="/updates/" className="link-arrow mt-4 text-sm">
            全部更新记录
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
