import Link from "next/link";

import { SITE } from "@/lib/site";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="12" fill="#2563EB" />
      <path d="M12 26.5 36 14l-8.5 22-4.3-8.8L12 26.5Z" fill="#fff" opacity="0.95" />
      <path d="M23.2 27.2 36 14" stroke="#DCEBFF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${className}`} title={`${SITE.name}首页`}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight text-ink">{SITE.name}</span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">{SITE.nameEn}</span>
      </span>
    </Link>
  );
}
