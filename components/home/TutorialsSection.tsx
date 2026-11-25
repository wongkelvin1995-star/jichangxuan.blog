import { ArrowRight, Layers, Monitor, Network, ShieldCheck, Smartphone, Tablet } from "lucide-react";
import Link from "next/link";

import { SectionHeading } from "@/components/layout/SectionHeading";
import { TUTORIAL_ENTRIES } from "@/lib/site";

const ICONS = {
  windows: Monitor,
  android: Smartphone,
  ios: Tablet,
  clash: Layers,
  tun: ShieldCheck,
  dns: Network,
} as const;

const EXTRA_LINKS = [
  { label: "哪些机场支持 Clash Meta 订阅", href: "/guides/clash-meta-compatible-airports/" },
  { label: "多设备共用机场", href: "/guides/multi-device-setup/" },
  { label: "灵动云客户端使用教程", href: "/lingdongyun/lingdongyun-client-guide/" },
];

export function TutorialsSection() {
  return (
    <section id="tutorials" className="container-x scroll-mt-24 py-12 md:py-16" aria-labelledby="tutorials-title">
      <SectionHeading
        id="tutorials-title"
        kicker="Guides"
        title="机场客户端与订阅使用教程"
        description="首页推荐榜上的品牌多数提供官方客户端，登录即可连接（梯子云的客户端要在用户中心确认）；只有部分品牌提供订阅链接，可以导入 Clash 等第三方客户端。下面按系统和场景分开写，每篇都能独立看完。"
        link={{ label: "全部使用教程", href: "/guides/" }}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TUTORIAL_ENTRIES.map((t) => {
          const Icon = ICONS[t.icon];
          return (
            <Link
              key={t.slug}
              href={`/guides/${t.slug}/`}
              className="card card-hover group flex items-start gap-4 p-5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-soft text-brand">
                <Icon size={22} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-base font-semibold text-ink group-hover:text-brand-strong">
                  {t.label}
                  <ArrowRight size={16} aria-hidden="true" className="text-brand opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100" />
                </span>
                <span className="sr-only">：</span>
                <span className="mt-1 block text-sm text-muted">{t.sub}</span>
              </span>
            </Link>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-ink-soft">
        订阅与设备相关：
        {EXTRA_LINKS.map((l, i) => (
          <span key={l.href}>
            <Link href={l.href} className="font-medium text-brand-strong hover:underline">
              {l.label}
            </Link>
            {i < EXTRA_LINKS.length - 1 ? "、" : "。"}
          </span>
        ))}
      </p>
    </section>
  );
}
