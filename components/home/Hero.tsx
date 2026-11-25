import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

import { SITE } from "@/lib/site";

function HeroBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 surface-gradient" />
      <svg
        className="absolute -right-24 top-0 h-[520px] w-[920px] max-w-none opacity-80 md:right-0"
        viewBox="0 0 920 520"
        fill="none"
      >
        <defs>
          <linearGradient id="hero-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2563EB" stopOpacity="0.35" />
            <stop offset="1" stopColor="#2563EB" stopOpacity="0" />
          </linearGradient>
          <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" stroke="#2563EB" strokeOpacity="0.07" fill="none" />
          </pattern>
        </defs>
        <rect width="920" height="520" fill="url(#hero-grid)" />
        <path d="M-20 420C180 300 300 460 480 340S800 180 960 260" stroke="url(#hero-line)" strokeWidth="2" />
        <path d="M-20 470C200 360 320 500 520 380S820 230 960 310" stroke="url(#hero-line)" strokeWidth="1.5" />
        <path d="M60 60L880 60" stroke="#2563EB" strokeOpacity="0.12" strokeDasharray="4 10" />
        <circle cx="690" cy="150" r="120" stroke="#2563EB" strokeOpacity="0.12" />
        <circle cx="690" cy="150" r="64" stroke="#2563EB" strokeOpacity="0.18" />
        <circle cx="690" cy="150" r="6" fill="#2563EB" fillOpacity="0.5" />
        <circle cx="300" cy="380" r="5" fill="#2563EB" fillOpacity="0.35" />
        <circle cx="520" cy="340" r="4" fill="#2563EB" fillOpacity="0.35" />
        <rect x="560" y="300" width="140" height="80" rx="12" fill="#DCEBFF" fillOpacity="0.6" />
        <rect x="740" y="330" width="100" height="56" rx="10" fill="#DCEBFF" fillOpacity="0.45" />
      </svg>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line-soft" aria-labelledby="hero-title">
      <HeroBackground />
      <div className="container-x relative py-14 md:py-20 lg:py-24">
        <div className="max-w-3xl">
          <span className="section-kicker animate-fade-in">
            {SITE.name} · {SITE.nameEn}
          </span>
          <h1 id="hero-title" className="animate-rise text-[2rem] font-bold leading-[1.2] tracking-tight text-ink sm:text-4xl md:text-5xl lg:text-[3.25rem]">
            {SITE.homeH1}
          </h1>
          <p className="animate-rise-delayed mt-5 max-w-2xl text-base leading-relaxed text-ink-soft md:text-lg">{SITE.heroSubtitle}</p>
          <div className="animate-rise-delayed-2 mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#ranking" className="btn btn-primary">
              2026 推荐排行榜
              <ArrowRight size={18} aria-hidden="true" className="btn-arrow" />
            </a>
            <a href="#prices" className="btn btn-secondary">
              <BookOpen size={18} aria-hidden="true" />
              十二家套餐价格比较
            </a>
          </div>
          <ul className="animate-rise-delayed-2 mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <li>价格注明核对日期</li>
            <li>测试记录注明日期、出口节点与方法</li>
            <li>
              推荐榜含推广合作因素，
              <Link href="/disclosure/" className="font-medium text-brand-strong underline underline-offset-2">
                推广合作披露
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
