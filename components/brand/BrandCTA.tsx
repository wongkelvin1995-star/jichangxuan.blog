import { ExternalLink } from "lucide-react";

import { brandEntryWord, brandLinkRel, type Brand } from "@/lib/brands";

interface BrandCTAProps {
  brand: Brand;
  label?: string;
  variant?: "primary" | "secondary" | "light";
  size?: "md" | "sm";
  className?: string;
}

/**
 * 品牌注册 / 购买按钮。地址只来自 lib/brands.ts；没有确认的地址时显示禁用态，不生成虚假链接。
 * 推广链接使用 rel="sponsored nofollow noopener noreferrer"。
 */
export function BrandCTA({ brand, label, variant = "primary", size = "md", className = "" }: BrandCTAProps) {
  const href = brand.affiliateUrl ?? brand.officialUrl;
  const sizeClass = size === "sm" ? "btn-sm" : "";
  const variantClass =
    variant === "primary"
      ? "btn-primary"
      : variant === "light"
        ? "bg-white text-brand-deep hover:bg-sky shadow-sm"
        : "btn-secondary";

  if (!href) {
    return (
      <span className={`btn btn-secondary ${sizeClass} cursor-not-allowed opacity-70 ${className}`} aria-disabled="true" title="地址待站长确认后启用">
        购买入口待确认
      </span>
    );
  }

  const sponsored = brand.relationship === "sponsored";
  return (
    <a href={href} target="_blank" rel={brandLinkRel(brand)} className={`btn ${variantClass} ${sizeClass} ${className}`}>
      {label ?? `前往${brand.name}${brandEntryWord(brand)}`}
      {sponsored && <span className="rounded bg-black/10 px-1 py-px text-[10px] font-semibold leading-tight">推广</span>}
      <ExternalLink size={16} aria-hidden="true" className="btn-arrow" />
    </a>
  );
}
